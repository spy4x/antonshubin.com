# Terminal part of the ts-libs demo clip. Run through record.sh, which sets
# DENO_DIR, TMUX_CONF, SMTP_PORT and the working directory; never on its own.
Output "terminal.mp4"

Set Shell "bash"
Set FontFamily "Hack"
Set FontSize 19
Set LineHeight 1.15
Set Width 1280
Set Height 720
Set Padding 12
Set Framerate 30
Set TypingSpeed 35ms
Set CursorBlink false
Set WindowBar ""
Set Theme { "name": "Desk", "background": "#15120f", "foreground": "#efebe2", "cursor": "#efebe2", "selection": "#2f2a26", "black": "#25211d", "red": "#f87e77", "green": "#83d494", "yellow": "#f5c26b", "blue": "#8ec5ec", "magenta": "#d4a5e8", "cyan": "#8fd3c8", "white": "#bcb7af", "brightBlack": "#857f79", "brightRed": "#f87e77", "brightGreen": "#83d494", "brightYellow": "#f5c26b", "brightBlue": "#8ec5ec", "brightMagenta": "#d4a5e8", "brightCyan": "#8fd3c8", "brightWhite": "#efebe2" }

Hide
Type "export PS1='\[\e[90m\]$\[\e[0m\] ' && cd booking && clear"
Enter
Sleep 500ms
Show

# 1. The README example, its four import lines lit one by one.
Type "bat main.ts"
Sleep 300ms
Enter
Sleep 900ms
Hide
Type "clear && bat --highlight-line 1 main.ts"
Enter
Sleep 400ms
Show
Sleep 700ms
Hide
Type "clear && bat --highlight-line 2 main.ts"
Enter
Sleep 400ms
Show
Sleep 700ms
Hide
Type "clear && bat --highlight-line 3 main.ts"
Enter
Sleep 400ms
Show
Sleep 700ms
Hide
Type "clear && bat --highlight-line 4 main.ts"
Enter
Sleep 400ms
Show
Sleep 1100ms
Hide
Type "clear && bat --highlight-line 8:10 main.ts"
Enter
Sleep 400ms
Show
Sleep 1800ms

# 2. Install the three packages, then serve: top pane of a tmux split.
Hide
Type "clear && tmux -L tslibs-demo -f $TMUX_CONF new-session -s demo"
Enter
Sleep 1000ms
Show
Type "deno add jsr:@spy4x/validation jsr:@spy4x/time jsr:@spy4x/email npm:arktype@2.2.3"
Sleep 400ms
Enter
Wait+Screen@60s /Add npm:arktype/
Sleep 1000ms
Type "SMTP_PASSWORD=not-real deno run --allow-net --allow-env --allow-sys main.ts"
Sleep 400ms
Enter
Wait+Screen@30s /Listening on/
Sleep 1400ms

# 3. Second pane: a bad email, then a good one.
Hide
Ctrl+B
Type '"'
Sleep 800ms
Show
Sleep 400ms
Type `curl -s -d '{"email":"nope","date":"2026-08-28","time":"10:00"}' localhost:8000 | jq -c`
Sleep 400ms
Enter
Wait+Screen@15s /was/
Sleep 2800ms
Type `curl -s -w '\n' -d '{"email":"jane@example.com","date":"2026-08-28","time":"10:00"}' localhost:8000`
Sleep 400ms
Enter
Wait+Screen@20s /Booked/
Sleep 1500ms

# The last frame of this part is reused beside the inbox; then stop the server.
Hide
Type "tmux -L tslibs-demo kill-server"
Enter
Sleep 300ms
