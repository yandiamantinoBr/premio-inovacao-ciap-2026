# CIAP/UFG no 3º Prêmio de Inovação

Galeria da conquista do ChatPP no 3º Prêmio de Inovação do Setor Público de Goiás, em Goiânia, em 24 de novembro de 2026. Desenvolvimento do site por [Yan Diamantino](https://github.com/yandiamantinoBr).

[Visitar a galeria](https://premio-inovacao-ciap-2026.vercel.app/) · [CIAP](https://ciap.org.br/) · [Universidade Federal de Goiás](https://ufg.br/) · [Vozes da Gestão Pública](https://vgp-site.vercel.app/)

O ChatPP representou a UFG na categoria Inovação em outras instituições públicas. [ChatPP no CIAP](https://ciap.org.br/chatpp) · [Prêmio no Observatório de Inovação](https://goias.gov.br/observatoriodeinovacao/premios/) · [Resultado divulgado pelo TCE-GO](https://portal.tce.go.gov.br/home?_101_assetEntryId=1568216&_101_struts_action=%2Fasset_publisher%2Fview_content&_101_urlTitle=tce-go-conquista-3-lugar-no-premio-de-inovacao-do-setor-publico&p_p_id=101&p_p_lifecycle=0&p_p_state=maximized)

As 12 peças têm versões horizontal e vertical, em Full HD e em arquivo leve, com e sem legendas gravadas na imagem. Os MP4 de distribuição estão na [edição de vídeos](https://github.com/yandiamantinoBr/premio-inovacao-ciap-2026/releases/tag/videos-2026-v1). As cartelas, fotografias e músicas integram a cobertura do evento. As faixas sincronizadas são de Liborio Conti. [Licença musical](https://www.no-copyright-music.com/license/)

## Desenvolvimento

Execute `node build.mjs` com Node 22 ou superior para montar a pasta `dist`. O build lê o catálogo versionado e baixa somente as versões leves para reprodução progressiva no mesmo domínio. Os downloads em Full HD apontam para a edição pública no GitHub. Para usar mídias já baixadas, defina `MEDIA_SOURCE_DIR` com o diretório dos MP4 da edição.

A página inicial, as páginas dos vídeos e os links de cada combinação de formato e legenda têm HTML estático com prévia Open Graph. Os arquivos de reprodução aceitam pedidos HTTP Range.
