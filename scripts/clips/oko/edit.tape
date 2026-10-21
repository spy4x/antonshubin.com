# The editor shot of the oko clip: a new service is pasted into config.json
# and saved. record.ts runs it with the staged config as the working
# directory, while oko serves that same file.
Output edit.mp4
Set Shell "bash"
Set FontFamily "Hack"
Set FontSize 22
Set LineHeight 1.25
Set Width 1280
Set Height 800
Set Padding 32
Set Framerate 30
Set TypingSpeed 70ms
Set Theme { "name": "site", "background": "#15120f", "foreground": "#efebe2", "cursor": "#f97316", "selection": "#2f2a26", "black": "#15120f", "red": "#f87e77", "green": "#83d494", "yellow": "#e9c46a", "blue": "#8ec5ec", "magenta": "#d4a5e6", "cyan": "#8ed3c8", "white": "#bcb7af", "brightBlack": "#857f79", "brightRed": "#f87e77", "brightGreen": "#83d494", "brightYellow": "#f5d58a", "brightBlue": "#8ec5ec", "brightMagenta": "#d4a5e6", "brightCyan": "#8ed3c8", "brightWhite": "#efebe2" }

Hide
Type "clear && nano --rcfile ./nanorc +63 config.json"
Enter
Sleep 1.5s
Show
Sleep 1.6s
# Typed while hidden, so the block appears at once, the way a paste does.
Hide
Type@6ms '        {'
Enter
Type@6ms '          "name": "Speed test",'
Enter
Type@6ms '          "url": "https://speed.${DOMAIN}",'
Enter
Type@6ms '          "icon": "⚡",'
Enter
Type@6ms '          "description": "Network speed test in the browser",'
Enter
Type@6ms '          "product": "LibreSpeed",'
Enter
Type@6ms '          "product_url": "https://librespeed.org/",'
Enter
Type@6ms '          "endpoint": "cloud_librespeed",'
Enter
Type@6ms '          "gatus_host": "uptime"'
Enter
Type@6ms '        },'
Enter
Show
Sleep 600ms
# Select the pasted lines for a moment, so the viewer sees what is new.
Alt+a
Up 10
Sleep 1.6s
Alt+a
Sleep 400ms
Ctrl+O
Sleep 700ms
Enter
Sleep 2s
Hide
Ctrl+X
