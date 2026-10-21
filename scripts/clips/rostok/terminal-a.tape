# Terminal part A of the rostok clip: install rostok from JSR, run the wizard against a real
# server, start the deploy. record.sh fills the @@...@@ placeholders and runs this with vhs; it is
# not meant to be run on its own. The shell is the clip's container (Containerfile) inside a tmux
# session record.sh started, so the install, the home folder and the SSH key are the container's,
# never this machine's, and the deploy keeps running after this tape ends.

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
Set TypingSpeed 45ms
Set Framerate 30
Set WaitTimeout 600s
Set CursorBlink false

Hide
Type "@@ATTACH@@"
Enter
Wait+Screen /jane@/
Type `mkdir -p ~/.ssh && cp /demo/id_ed25519 /demo/known_hosts ~/.ssh/ && chmod 600 ~/.ssh/* && export PS1='\[\e[38;2;133;127;121m\]\w\[\e[0m\] $ ' && clear`
Enter
Sleep 1s
Show

# Shot 1: install.
Sleep 600ms
Type "deno install -g -A -n rostok jsr:@rostok/cli@@@VERSION@@"
Sleep 500ms
Enter
Wait+Line /~ \$\s*$/
Sleep 2400ms

# Shot 2: a new folder, then the wizard. Defaults are kept with Enter.
Type "mkdir ~/rostok && cd ~/rostok && rostok"
Sleep 400ms
Enter
Wait+Line /generate one now/
Sleep 900ms
Enter
Wait+Line /Image versions/
Sleep 500ms
Enter
Wait+Line /Server name/
Sleep 500ms
Enter
Wait+Line /SSH target/
Sleep 300ms
Type "@@SSH@@"
Sleep 300ms
Enter
Wait+Line /Primary domain/
Sleep 400ms
Type "@@DOMAIN@@"
Sleep 300ms
Enter
Wait+Line /certificate notices/
Sleep 300ms
Type "@@EMAIL@@"
Sleep 300ms
Enter

# PROJECT, DOCKER_GROUP_ID, TIMEZONE, PUID, PGID, VOLUMES_PATH, PATH_APPS: keep the defaults.
Wait+Line /project identifier/
Sleep 350ms
Enter
Wait+Line /Docker group ID/
Sleep 250ms
Enter
Wait+Line /Time zone/
Sleep 250ms
Enter
Wait+Line /Container user ID/
Sleep 250ms
Enter
Wait+Line /Container group ID/
Sleep 250ms
Enter
Wait+Line /app data is stored/
Sleep 250ms
Enter
Wait+Line /puts your apps/
Sleep 250ms
Enter

# Shot 3: pick librespeed (the 23rd stack) and traefik (the 39th), then confirm.
# The picker hides the cursor, so no Wait can see it; the stack list is local and quick.
Sleep 3s
Down 22
Sleep 300ms
Space
Sleep 500ms
Down 16
Sleep 300ms
Space
Sleep 800ms
Enter
Sleep 600ms
Enter
Wait+Line /rostok \$\s*$/
Sleep 3500ms

# Shot 4: deploy. Part A ends a few seconds in; record.sh waits for the deploy to finish and
# part B (terminal-b.tape) shows its end, captioned with the time the cut hides.
Type "rostok deploy home"
Sleep 400ms
Enter
Sleep 5s
