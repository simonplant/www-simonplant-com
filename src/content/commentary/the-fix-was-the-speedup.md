---
title: "The Fix Was the Speedup"
publishedDate: 2026-04-18
tags: [agent-ops, local-inference, security, infrastructure, day-2-operations]
description: "A drifted systemd override left an unauthenticated LLM endpoint on a public IPv6 and pinned gemma4 inference to an Ollama binary that hadn't yet flipped flash attention on. One cleanup closed both — same hardware, same weights, same vendored llama.cpp."
status: published
tier: deep-dive
---

I had an unauthenticated LLM endpoint open to the public internet.

Not in a benchmark. Not in a test. On my dev workstation, on a routable IPv6 address, on the same box running my personal agent. I don't know for how long. The config had drifted. I hadn't noticed.

The fix — moving Ollama into a container on an internal Docker network with no host port — closed the exposure. It also made generation 74% faster on the same hardware, the same weights, the same quantization. From 112 tokens per second to 195.

The speedup wasn't the goal. It was the side effect. Both wins came from the same cleanup, and both had the same root cause: a configuration I had stopped reading.

## How the exposure happened

Ollama was installed as a host systemd unit months ago. Over time I edited its override file iteratively, not carefully, tuning context length, parallel slots, bind address, keepalive. By the time I looked at the file recently, it had thirteen `Environment=` lines. Among them:

- Two `OLLAMA_HOST=` entries with conflicting bind addresses
- Three `OLLAMA_NUM_PARALLEL=` entries with different values
- Two `OLLAMA_CONTEXT_LENGTH=` entries

Systemd resolves duplicate `Environment=` directives with last-wins. The *effective* configuration was whatever happened to come last in the file, an order I no longer remembered. Reading the override to figure out what Ollama was actually listening on took ten minutes of squinting.

It was listening on `0.0.0.0:11434`. No auth. On a machine with a routable public IPv6 address. The bind setting had come from an early `OLLAMA_HOST=0.0.0.0` line I'd added months ago for LAN access and then buried under a stack of subsequent edits. A later duplicate happened to re-apply the same value. The fact that the bind was public wasn't an active choice. It was the residue of edits I no longer tracked.

A journal grep turned up only local IPs: localhost, LAN, Docker bridges. But Ollama doesn't log `/api/generate` by default, and journals rotate. Absence of evidence is weak evidence. The honest answer is that I don't know who, if anyone, hit that endpoint, or for what window.

## The baseline

Before changing anything, I measured. Single run, repeatable:

```
$ ollama run gemma4:26b "Write a 200-word description of the Roman aqueducts." --verbose
eval count:    1,104 tokens
eval duration: 9.85s
eval rate:     112.11 tok/s
```

112 tok/s generation on Q4_K_M of a 26B model on an RTX 5090. Not bad in the abstract. I also had no idea whether it was the right number or a stale one.

## The architectural move

The fix wasn't a knob. It was a restructuring.

Ollama moved from the host into a container on the same internal Docker network as my OpenClaw service. Three things carried most of the weight.

**No host port.** The Ollama container has no `ports:` section in compose. It's reachable only from containers on the same network. From the host, from LAN, from the public internet: no listener. Inside the network, `http://ollama:11434` resolves via Docker DNS. An entire class of exposure collapses to zero, not because anything is blocking it but because nothing is listening.

**GPU passthrough via nvidia-container-toolkit.** The CDI-based integration: registered the NVIDIA repo with a signed keyring, installed the toolkit, ran `nvidia-ctk runtime configure --runtime=docker`, reserved the GPU in compose under `deploy.resources.reservations.devices`. Not `runtime: nvidia` *and* `deploy.resources`. That combo either duplicates or conflicts depending on your default runtime. One path.

**Model volume mounted one level deeper than the obvious choice.** The host's `OLLAMA_MODELS` had pointed directly at the models subtree, so `blobs/` and `manifests/` lived at the root of `/mnt/data/ollama`. The container image expects them under `/root/.ollama/models/`. The obvious mount is `/mnt/data/ollama:/root/.ollama`, which makes `ollama list` return empty and triggers a 17 GB re-download. Mounting one level deeper — `/mnt/data/ollama:/root/.ollama/models` — aligns the layouts. The symptom doesn't point at the cause. Worth naming.

OpenClaw's config went from `http://host.docker.internal:11434`, a scaffold from when Ollama lived on the host, to `http://ollama:11434`. One less gateway hop.

## The measurement

Same prompt, same model, post-migration, running inside the container:

```
eval count:    803 tokens
eval duration: 4.12s
eval rate:     195.02 tok/s
```

195 tok/s, up from 112. A 74% improvement. The eval rate is Ollama's own reported value, `eval_count / eval_duration`, which excludes prompt-eval and model-load time. Don't try to derive it from total duration: on a cold container start, `total_duration` includes a 50-second VRAM fill that isn't part of generation throughput.

## Where the speedup actually came from

This is where I have to be honest, because the tempting first story — "containerization made it faster" — isn't true. Containerization on a modern nvidia-container-toolkit path has near-zero GPU overhead. The toolkit injects the host driver into the container; CUDA calls go straight to the kernel; VRAM and DMA are identical to bare metal. I went in expecting parity and ready to chase a regression if anything moved the wrong way.

My second hypothesis was that the newer Ollama shipped a newer vendored `llama.cpp` with tuned CUDA kernels. Also wrong. The vendored commit pin is identical across the releases I ran: `FETCH_HEAD=ec98e2002` in `Makefile.sync` at both `v0.20.0` and `v0.21.0`. Not a line of ggml or CUDA kernel code differs between the binaries I measured. "Newer `llama.cpp`" is not the mechanism.

What actually changed is subtler.

**The gemma4 flash-attention gate.** Commit `e823bff87` ("gemma4: enable flash attention"), landed between the two releases I ran, backports GGML kernels specifically to turn flash attention on for the Gemma 4 model path on CUDA and Metal. An earlier attempt (`c8e087881`) had been reverted (`4bc272804`) because the kernels weren't in place; the re-land ships them. A follow-up, `dde09129d` ("gemma4: Disable FA on older GPUs where it doesn't work"), narrows the gate to GPUs the backport actually runs on.

Translation: on gemma4, flash attention at the model-path level was *off* in 0.20.0 and *on* in 0.21.0, provided the GPU is new enough. My RTX 5090 is sm_120. It lands on the winning side of that gate. The env var `OLLAMA_FLASH_ATTENTION=1` being set on both sides is irrelevant for this model — the gemma4 code path was gating FA independently, and in 0.20.0 it was gating it off regardless.

This is not an improvement in `llama.cpp` kernels. The kernel code is bit-identical. It's an Ollama-side decision about when to feed tensors through those kernels for this specific model.

**Other variables worth naming.**

- *Container vs host build flags.* The official `ollama/ollama` image is compiled with a known CUDA arch matrix, flash-attention kernels, and cuBLASLt linkage. A host binary installed from a package manager months ago may have been compiled with narrower `-DGGML_CUDA_*` flags or a mismatched CUDA toolkit. I didn't check. It's a secondary contributor I can't rule out.
- *The effective configuration.* The old systemd override had duplicate lines in no order I could reconstruct. For gemma4 the FA toggle was model-path gated, so the env var wouldn't have helped even if set. For other models the env-var drift could still matter. This benchmark wasn't on other models.

**Variables that demonstrably didn't move.**

- NVIDIA driver stayed at 590.48.01. CUDA at 13.1. Kernel at 6.17.
- Vendored `llama.cpp`: identical commit, verified at the tag.
- Model weights: bit-identical blobs, bind-mounted from the same path.
- Hardware. Gen5 NVMe affects cold-load latency, not VRAM-resident generation.
- CPU governor stayed on `powersave` across both measurements.
- `NUM_PARALLEL=1`, `CONTEXT_LENGTH=16384`, `KEEP_ALIVE=24h` — declared in both runtimes.

**Honest attribution.** The gemma4 FA gate flip is the likely dominant cause, probably carrying most of the 74% on this specific (model, GPU) pair. Host-vs-container build flags are a possible secondary contributor. I haven't separated them. The clean experiment is to run the old 0.20.0 binary again against the current driver and compare against the container; that A/B would cleanly split "Ollama runtime decision" from "my stale compile flags." I didn't run it. The number was good. That's a limit of this write-up, and I'd rather name it than smuggle past it.

What I can say cleanly: on gemma4 specifically, on a recent-generation GPU, a single named Ollama-side commit flips flash attention on via backported kernels. That's the mechanism. It's not "newer kernels." It's "same kernels, newer decision to use them."

## Things I was tempted to claim and won't

- *"Containerization made it faster."* The overhead is near-zero. That's not the same as "containerizing makes your inference faster." The speedup came from the binary under the container, not the container around the binary.
- *"Newer `llama.cpp` is why it's faster."* I believed this when I first sat down to write. I was wrong. The vendored `llama.cpp` commit is identical at both tags. Same kernel code, different Ollama decision about when to use it.
- *"74% everywhere."* `dde09129d` explicitly disables the gemma4 FA path on older GPUs where the backport doesn't work. If you're on Ampere or older, this version bump may buy you nothing at all on this model. Measure before you quote the number.
- *"Any model will see this."* The gate is in the gemma4 code path. Other models are on their own release timelines and their own gates. No universal claim.
- *"The CPU governor flip helped."* It didn't. Still on `powersave` at measurement time.
- *"The Gen5 NVMe helped generation."* It helped cold load. Generation is VRAM-resident.

## What I should have caught

Every one of the things that went wrong was preventable, and each would have been visible in a single pass of basic hygiene:

- `ss -tlnp | grep 11434` would have shown the public bind any day I cared to run it.
- `ufw status verbose` was cluttered with stale Docker-subnet allow rules for a service that no longer needed them.
- `dpkg -l | grep ollama` against upstream releases would have shown how far behind the host binary was.
- The override file had been unreadable for weeks. I'd been editing past the point of comprehension instead of rewriting cleanly.

None of this is exotic. It's what you'd tell a junior operator to do on day one. I had stopped doing it on my own machine because it was "mine" and "working." Both words are traps. "Mine" means nobody else is auditing it. "Working" means nothing about the parts of the system you aren't checking.

The instinct to leave working systems alone is usually right. The instinct to treat personal infrastructure as exempt from the hygiene you'd demand of production is not. My dev box has a routable public IPv6. It talks to the same model my agent talks to. The threat surface doesn't know the machine is personal.

## The pattern

Two generalizations worth keeping.

**Structural rewrite beats knob-tuning when your config has drifted.** If a service's configuration file is hard to read, its *effective* configuration is probably not what you think it is. The fix is not another knob. The fix is to rewrite the config somewhere you can read, in one pass, with every choice explicit. Moving from a systemd override to compose-and-environment was that pass, and it's why the security hole and the performance ceiling became visible in the same motion.

**Your inference binary is probably stale, but the mechanism matters.** What's moving is not always `llama.cpp` itself. In my case the vendored commit pin was identical between the two Ollama versions I measured. What had moved was an Ollama-side decision about when to use flash attention for gemma4 — an in-runtime gate, model-specific, GPU-specific, deliberately narrowed in a follow-up commit. Your binary may not be missing kernel-level improvements. It may be missing one commit that flips a feature on for the specific (model, GPU) combo you actually run. The delta is per-workload, not universal, and you won't know until you measure. The container image tag is still the freshness signal: pin it, bump it deliberately, and the staleness stops being invisible. A static binary in `/usr/local/bin` never prompts you to check.

Neither of these is a revelation. Both get said at every ops review and then ignored at home. I ignored them, on my own machine, with a public IPv6 address and an unauthenticated endpoint.

The fix was the speedup. The speedup was the fix. It's the same cleanup, and the lesson is that the cleanup was overdue long before either number showed up.

---

*Single-run measurements on Ubuntu 24.04, kernel 6.17, NVIDIA driver 590.48.01, CUDA 13.1, Docker 27.x, nvidia-container-toolkit 1.19.0. RTX 5090 (32 GB), Ryzen 9 9950X3D, 64 GB DDR5, Samsung 9100 PRO 4 TB. Model: gemma4:26b Q4_K_M. Expect ±2–5% run-to-run variance. Commit SHAs referenced against the `ollama/ollama` repo; verify with `gh api /repos/ollama/ollama/commits/<sha>`.*
