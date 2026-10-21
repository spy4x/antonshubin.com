# Terminal half of the zond demo clip (shots 1-4 of #462's storyboard).
# record.sh runs it from a throwaway copy of this folder, so every path on
# screen is relative and the stand-in services are already up.

Output terminal.mp4

Set Shell bash
Set Width 1280
Set Height 800
Set FontSize 24
Set FontFamily "Hack"
Set LineHeight 1.25
Set Padding 36
Set Framerate 30
Set TypingSpeed 55ms
Set CursorBlink false
Set Theme { "name": "Ink", "background": "#15120f", "foreground": "#efebe2", "cursor": "#efebe2", "selection": "#413c38", "black": "#15120f", "red": "#f87e77", "green": "#83d494", "yellow": "#e9c46a", "blue": "#8ec5ec", "magenta": "#d4a5e8", "cyan": "#8ec5ec", "white": "#efebe2", "brightBlack": "#857f79", "brightRed": "#f87e77", "brightGreen": "#83d494", "brightYellow": "#e9c46a", "brightBlue": "#8ec5ec", "brightMagenta": "#d4a5e8", "brightCyan": "#8ec5ec", "brightWhite": "#ffffff" }

Hide
Type "export PS1='\[\e[38;2;188;183;175m\]~/stack\[\e[0m\] $ ' && clear"
Enter
Sleep 500ms
Show

# 1. The config watches one service.
Sleep 400ms
Type "cat zond.yml"
Sleep 300ms
Enter
Sleep 1600ms

# 2. Add ollama and grafana, as in zond.example.yml, and save.
Type "nano zond.yml"
Enter
Sleep 900ms
Down 6
Sleep 300ms
Type@42ms "  - name: ollama"
Enter
Type@42ms "    url: http://hl-ollama:11434/api/tags"
Enter
Type@42ms "    timeout: 10000"
Enter
Type@42ms "  - name: grafana"
Enter
Type@42ms "    url: http://hl-grafana:3000/api/health"
Enter
Type@42ms "    timeout: 3000"
Sleep 900ms
Ctrl+O
Sleep 500ms
Enter
Sleep 700ms
Ctrl+X
Sleep 500ms

# 3. Start zond next to the services.
Type "docker compose up -d"
Sleep 300ms
Enter
Sleep 2s

# 4. Ask it about metube.
Type "curl -i localhost:8080/health/metube"
Sleep 300ms
Enter
Sleep 2600ms
