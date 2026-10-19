# Scene 2: off camera, the secrets go into infra/envs/.env (fill-env.sh) and
# the web push keys are made; on camera, the proxy and the stack start and
# Compose reports every service started. Same logging as scene 1.
Hide
Type `cd my-product && "$CLIP_FILL_ENV" . && deno task vapid-key:create >/dev/null 2>&1 && export PS1='\[\e[38;2;249;115;22m\]\W\[\e[0m\] \$ ' PS0='$(date +%s.%N >> "$CLIP_LOG/start")' PROMPT_COMMAND='date +%s.%N >> "$CLIP_LOG/end"'; : > "$CLIP_LOG/start"; : > "$CLIP_LOG/end"; clear`
Enter
Wait@300s /\$\s*$/
Sleep 500ms
Show
Sleep 400ms
Type "deno task proxy:start"
Sleep 200ms
Enter
Wait@300s /\$\s*$/
Sleep 400ms
Type "deno task dev"
Sleep 200ms
Enter
Wait@900s /\$\s*$/
Sleep 1800ms
