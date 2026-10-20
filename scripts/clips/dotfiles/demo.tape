# The /tools/dotfiles clip: in sync, one rule edited, the check fails, apply, in sync again.
# Run through record.sh, which stages the scratch home this tape enters.
Output demo-raw.mp4
Set Shell "bash"
Set FontFamily "Hack"
Set FontSize 20
Set LineHeight 1.25
Set Width 1280
Set Height 720
Set Padding 28
Set Margin 24
Set MarginFill "#15120f"
Set WindowBar Colorful
Set BorderRadius 10
Set Framerate 30
Set TypingSpeed 55ms
Set CursorBlink false
Set Theme { "name": "ink", "background": "#1c1916", "foreground": "#efebe2", "cursor": "#efebe2", "selection": "#3a342d", "black": "#25211d", "red": "#f87e77", "green": "#83d494", "yellow": "#e5c07b", "blue": "#8ec5ec", "magenta": "#d4a5e8", "cyan": "#7fd1c7", "white": "#bcb7af", "brightBlack": "#6b655c", "brightRed": "#f87e77", "brightGreen": "#83d494", "brightYellow": "#e5c07b", "brightBlue": "#8ec5ec", "brightMagenta": "#d4a5e8", "brightCyan": "#7fd1c7", "brightWhite": "#efebe2" }

Hide
Type "exec ./enter.sh stage"
Enter
Sleep 1s
Type "alias nvim='nvim --clean -u ~/demo.vim'; clear"
Enter
Sleep 500ms
Show

# 1. In sync.
Sleep 500ms
Type "deno task ai --check"
Sleep 300ms
Enter
Sleep 2.5s

# 2. One rule edited: "Laconic" becomes "Terse".
Type "nvim ai-harnesses/AGENTS.md"
Sleep 300ms
Enter
Sleep 1.2s
Type "viw"
Sleep 700ms
Type "c"
Type@90ms "Terse"
Sleep 400ms
Escape
Sleep 300ms
Type ":w"
Enter
Sleep 1.1s
Type ":q"
Enter
Sleep 500ms

# 3. The check names the drifted file in each harness and exits 1.
Type "deno task ai --check; echo $?"
Sleep 300ms
Enter
Sleep 4s

# 4. Apply.
Type "deno task ai"
Sleep 300ms
Enter
Sleep 3s

# 5. In sync again: the poster frame.
Type "deno task ai --check"
Sleep 300ms
Enter
Sleep 4s
