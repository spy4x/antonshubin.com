# Terminal part B of the rostok clip: the end of the deploy that part A started. record.sh runs it
# once the deploy has finished; it re-attaches to the same tmux session and holds on the result.

Output "@@OUT@@"

Set Shell "bash"
Set FontFamily "Noto Sans Mono"
Set FontSize 24
Set LineHeight 1.1
Set Width 1280
Set Height 800
Set Padding 36
Set Margin 0
Set WindowBar ""
Set BorderRadius 0
Set Theme { "name": "ink", "black": "#15120f", "red": "#f87e77", "green": "#83d494", "yellow": "#e9c46a", "blue": "#8ec5ec", "magenta": "#d6a2e8", "cyan": "#8fd3c7", "white": "#efebe2", "brightBlack": "#857f79", "brightRed": "#f87e77", "brightGreen": "#83d494", "brightYellow": "#e9c46a", "brightBlue": "#8ec5ec", "brightMagenta": "#d6a2e8", "brightCyan": "#8fd3c7", "brightWhite": "#ffffff", "background": "#15120f", "foreground": "#efebe2", "selection": "#2f2a26", "cursor": "#f97316" }
Set TypingSpeed 55ms
Set Framerate 30
Set WaitTimeout 600s
Set CursorBlink false

Hide
Type "@@ATTACH@@"
Enter
Wait+Line /rostok \$\s*$/
Sleep 300ms
Show
Sleep 4s
