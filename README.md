# Twitter Wallpaper

Gerador frontend para transformar tweets em wallpaper de celular com visual inspirado no X/Twitter.

## Analytics

O projeto já está preparado para GoatCounter no build de produção.

1. Crie sua conta em [GoatCounter](https://www.goatcounter.com/).
2. Copie a URL do contador no formato `https://SEU-CODIGO.goatcounter.com/count`.
3. No GitHub do repositório, abra `Settings > Secrets and variables > Actions > Variables`.
4. Crie a variável `VITE_GOATCOUNTER_URL` com essa URL.
5. Faça um novo push na `main` ou reexecute o workflow de deploy.

Sem essa variável, o app continua funcionando normalmente e não envia analytics.
