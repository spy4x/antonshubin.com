# Scene 1: clone Seed and copy the example env file. Run by record.sh from an
# empty folder, with CLIP_LOG set; the hidden first line sets the prompt and
# logs when each command starts (PS0) and ends (PROMPT_COMMAND), so
# compose.ts can speed up the waits.
Hide
Type `export PS1='\[\e[38;2;249;115;22m\]\W\[\e[0m\] \$ ' PS0='$(date +%s.%N >> "$CLIP_LOG/start")' PROMPT_COMMAND='date +%s.%N >> "$CLIP_LOG/end"'; : > "$CLIP_LOG/start"; : > "$CLIP_LOG/end"; clear`
Enter
Sleep 500ms
Show
Sleep 500ms
Type "git clone https://github.com/spy4x/seed.git my-product"
Sleep 300ms
Enter
Wait@180s /\$\s*$/
Sleep 300ms
Type "cd my-product"
Enter
Sleep 300ms
Type "cp infra/envs/.env.example infra/envs/.env"
Sleep 200ms
Enter
Sleep 700ms
