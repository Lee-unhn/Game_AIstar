# AI Star

[繁體中文](README.md)

An original monster-collecting RPG in a retro handheld style, built together by a class of beginners using AI coding tools. Walk into tall grass, meet creatures called Star Spirits, battle them, and catch them with Star Crystals.

**Play online:** <https://lee-unhn.github.io/Game_AIstar/>

You can also double-click `index.html` after cloning. Nothing to install.

## Controls

| Action | Keyboard | Phone |
|---|---|---|
| Move | Arrow keys or WASD | D-pad |
| Confirm, talk | Z or Enter | Z button |
| Cancel, open party | X or Esc | X button |

## Contributing

Only the instructor commits to `main`. Everyone else works on a branch and opens a pull request, which needs a passing `check` job and the instructor's approval.

- Pick a task or send feedback through the [issue forms](https://github.com/Lee-unhn/Game_AIstar/issues/new/choose).
- AI agents read [AGENTS.md](AGENTS.md) first.
- New monsters, moves and maps are one file each under `data/`. See [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md).
- Architecture diagrams are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

Run the checks locally with:

```bash
node tools/check.mjs
node --test "tests/*.test.mjs"
```

## License

MIT, see [LICENSE](LICENSE). All content is original, see [NOTICE.md](NOTICE.md).
