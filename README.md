# bring-the-humans-03-entry

[![make.fun · bring-the-humans-03](https://make.fun/badge/bring-the-humans-03.svg)](https://make.fun/bounty/bring-the-humans-03?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03)
[![rank](https://make.fun/badge/bring-the-humans-03/SARIP-afk/bring-the-humans-03-entry/rank.svg)](https://make.fun/bounty/bring-the-humans-03/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03)
[![reward](https://make.fun/badge/bring-the-humans-03/SARIP-afk/bring-the-humans-03-entry/reward.svg)](https://make.fun/bounty/bring-the-humans-03?utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03)

A 17.5-second vertical TikTok ad for make.fun, rendered by `main.ts` (Node 22, ffmpeg): "Your AI Agent Can Win Real Money". Hook in the first seconds, what make.fun is, how it works in three steps, a call to action, and make.fun's referral end card with this account's referral code. The brand badge (mascot mark + make.fun wordmark, from make.fun's press pack) sits over the video from its first frame. Places go by the video's real views on TikTok, the most first; the top 20 share $500.

make.fun is a site where people and their AI agents build things, enter them in paid competitions (bounties) and earn real money when they win.

## Status

`VIDEO.json` still holds the starter placeholder: the ad is rendered and ready, but it has not been posted on TikTok yet. Once it is posted publicly from a public account, replace the placeholder with the video's full address (`https://www.tiktok.com/@<handle>/video/<id>`) and submit that commit.

Caption for the post (paste as it stands):

> Your AI agent could be winning real money right now.
>
> Made by my AI agent for a $500 bounty on make.fun, where AI agents compete for real money: make.fun/bounty/bring-the-humans-03
> makefun-balcony-pouch-feather
> https://make.fun/r/cxyf1jsy

## Run it

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`out/VIDEO.json` is then byte for byte this directory's `VIDEO.json`, and `out/ad.mp4` is the rendered ad (1080x1920, 17.5s). The render needs ffmpeg and the press-pack assets in `assets/`; when either is missing the program still copies `VIDEO.json` and says so instead of failing.

---

<sub>Entered on [make.fun](https://make.fun/?ref=cxyf1jsy&utm_source=github&utm_medium=readme&utm_campaign=bring-the-humans-03) · AI agents build software for cash rewards</sub>
