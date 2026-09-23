# ADR 0013 — Pipeline de Upload de Imagens com Presigned URLs (Supabase Storage)

**Data:** 2026-09-23  
**Status:** Aceito  
**Autor:** Equipe ADS-PI-II Menu Digital  
**Débito Técnico Relacionado:** Seção 10.2 do Relatório Técnico de Engenharia (Upload de Imagens para Object Storage)

---

## Contexto

Anteriormente, a seleção de fotos nos fluxos de cadastro e edição de pratos do cardápio (`MenuItemFormModal.tsx`) e do perfil do restaurante (`editar-perfil-restaurante.tsx`) utilizava o `expo-image-picker`, gerando URIs locais do dispositivo (`file://`, `content://` ou `ph://`). 

Essas URIs locais não persistiam em nuvem nem eram acessíveis por outros aparelhos ou clientes Web. Além disso, transmitir binários pesados de imagens através de multipart/form-data diretamente pelo servidor Node.js/Express sobrecarregaria a CPU e memória da API, além de gerar gargalos de escalabilidade.

---

## Decisões

### 1. Desacoplamento de Tráfego via Presigned URLs (Signed Upload URLs)

Adotou-se o padrão de **Presigned URLs** com o Supabase Storage:
1. O backend Express **não recebe nem manipula binários de imagens**. Sua responsabilidade é estritamente orquestrar a autorização e gerar a URL temporária pré-assinada de upload.
2. O aplicativo móvel faz um `fetch` nativo com método `PUT` transmitindo os bytes da imagem diretamente para o bucket do Supabase Storage.
3. A URL pública definitiva com CDN (`publicUrl`) é gravada no banco de dados PostgreSQL via Prisma (`photoUrl` em `menu_items`, `url` em `restaurant_photos` e `image_url` em `restaurants`).

### 2. Contratos Compartilhados Zod (`packages/contracts`)

* `uploadPresignedUrlRequestSchema`: Valida `fileName` (sanitizado), `contentType` restrito a `["image/jpeg", "image/png", "image/webp"]`, `contentLength` inteiro positivo até 10MB, e `folder` opcional.
* `uploadPresignedUrlResponseSchema`: Valida o retorno contendo `presignedUrl` (URL com token temporário de upload), `publicUrl` (URL pública definitiva) e `key` (caminho seguro no storage).

### 3. Camadas de Backend (`apps/api`)

* **Service (`UploadService`)**: Utiliza `supabaseAdmin` para invocar `createSignedUploadUrl(filePath, { upsert: true })` e `getPublicUrl(filePath)`, gerando chaves no padrão `${folder}/${userId}/${uuid}-${sanitizedFileName}` para isolamento de dados e prevenção de path traversal.
* **Controller (`UploadController`)**: Extrai o usuário autenticado (`req.user.id`) e retorna 401 caso não autenticado.
* **Rota (`POST /upload/presigned-url`)**: Protegida pelo `authMiddleware` e validada pelo middleware `validateRequest(uploadPresignedUrlRequestSchema)`.

### 4. Camadas de Mobile (`apps/mobile`)

* **Serviço HTTP (`api.ts`)**: Adicionadas as funções `requestPresignedUploadUrl`, `uploadImageBinary` e `uploadImageFromUri`.
* **Hook Reutilizável (`useImagePicker`)**: Centraliza as permissões de câmera e galeria, disparo do `expo-image-picker`, feedback visual de progresso (`isUploading`) e upload automático via Presigned URL.
* **Componentes Atualizados**: `MenuItemFormModal.tsx` e `editar-perfil-restaurante.tsx` agora integram o hook, garantindo que 100% das fotos sejam enviadas para o Supabase Storage e exibidas com cache otimizado pelo `expo-image`.

---

## Consequências

### Positivas
* **Zero Carga no Servidor Express:** O backend consome memória desprezível (apenas JSON com metadados) e nenhuma imagem binária concorre com requisições de API.
* **Segurança e Isolamento:** URLs de upload possuem expiração e são segregadas por pasta e identificador de usuário (`userId`).
* **Cache em CDN e Performance:** Fotos armazenadas no Supabase Storage contam com cache HTTP global, consumidas eficientemente pelo `expo-image`.
* **Resiliência a Falhas:** As telas contam com fallback que converte qualquer URI local pendente em URL na nuvem antes da persistência no banco de dados.

### Neutras / Mitigações
* Exige que o bucket do Supabase Storage esteja configurado no projeto (o backend possui fallback gracioso e mock completo nas 152 suítes de testes unitários).
