const STORAGE_KEYS = {
    cart: "relic-cart",
    favorites: "relic-favorites",
    users: "relic-users",
    session: "relic-session",
    checkoutRedirect: "relic-checkout-redirect",
    theme: "relic-theme",
    orders: "relic-orders",
    lastOrder: "relic-last-order"
};

function readJson(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function lerCarrinho() {
    return readJson(STORAGE_KEYS.cart, []).map(normalizarItemCarrinho).filter(Boolean);
}

function salvarCarrinho(carrinho) {
    writeJson(STORAGE_KEYS.cart, carrinho.map(normalizarItemCarrinho).filter(Boolean));
}

function lerFavoritos() {
    return readJson(STORAGE_KEYS.favorites, []);
}

function salvarFavoritos(favoritos) {
    writeJson(STORAGE_KEYS.favorites, favoritos);
}

function estaNosFavoritos(nome) {
    return lerFavoritos().some((item) => item.nome === nome);
}

function lerUsuarios() {
    return readJson(STORAGE_KEYS.users, []);
}

function salvarUsuarios(usuarios) {
    writeJson(STORAGE_KEYS.users, usuarios);
}

function lerSessao() {
    return readJson(STORAGE_KEYS.session, null);
}

function salvarSessao(usuario) {
    writeJson(STORAGE_KEYS.session, usuario);
}

function limparSessao() {
    localStorage.removeItem(STORAGE_KEYS.session);
}

function salvarRedirectCheckout(destino) {
    localStorage.setItem(STORAGE_KEYS.checkoutRedirect, destino);
}

function lerRedirectCheckout() {
    return localStorage.getItem(STORAGE_KEYS.checkoutRedirect);
}

function limparRedirectCheckout() {
    localStorage.removeItem(STORAGE_KEYS.checkoutRedirect);
}

function lerPedidos() {
    return readJson(STORAGE_KEYS.orders, []);
}

function salvarPedidos(pedidos) {
    writeJson(STORAGE_KEYS.orders, pedidos);
}

function normalizarTexto(valor) {
    return (valor || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function formatarPreco(preco) {
    return Number(preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function lerProdutos() {
    return window.RELIC_PRODUCTS || [];
}

function buscarProdutoPorId(id) {
    return lerProdutos().find((produto) => produto.id === id) || null;
}

function buscarProdutoPorNome(nome) {
    return lerProdutos().find((produto) => normalizarTexto(produto.title) === normalizarTexto(nome)) || null;
}

function obterEstoqueProduto(produto) {
    if (!produto) {
        return 0;
    }

    const match = String(produto.availability || "").match(/\d+/);
    return match ? Number(match[0]) : 0;
}

function normalizarItemCarrinho(item) {
    if (!item) {
        return null;
    }

    const produto = item.id ? buscarProdutoPorId(item.id) : buscarProdutoPorNome(item.nome);
    const quantidade = Math.max(1, Number(item.quantidade || item.quantity || 1));
    const estoque = obterEstoqueProduto(produto);

    return {
        id: produto?.id || item.id || null,
        nome: produto?.title || item.nome,
        preco: Number(produto?.price ?? item.preco ?? 0),
        imagem: produto ? new URL(produto.image, window.location.href).href : new URL(item.imagem, window.location.href).href,
        quantidade: estoque > 0 ? Math.min(quantidade, estoque) : quantidade
    };
}

function obterQuantidadeNoCarrinho(produtoId) {
    return lerCarrinho()
        .filter((item) => item.id === produtoId)
        .reduce((total, item) => total + Number(item.quantidade || 1), 0);
}

function obterRelacionados(produto, limite = 3) {
    return lerProdutos()
        .filter((item) => item.category === produto.category && item.id !== produto.id)
        .slice(0, limite);
}

function obterBadgeProduto(produto) {
    if (!produto) return "Destaque";
    if (produto.badge) return produto.badge;

    if (normalizarTexto(produto.availability).includes("1 unidade")) return "Raro";
    if (normalizarTexto(produto.authenticity).includes("original")) return "Primeira edicao";
    if (normalizarTexto(produto.condition).includes("lacrado")) return "Lacrado";
    if (produto.category === "jogos") return "Classico";
    if (produto.category === "cartas") return "Edicao limitada";
    if (produto.category === "livros") return "Colecao";
    return "Curadoria";
}

function gerarPlaceholderImagem(titulo) {
    const texto = encodeURIComponent((titulo || "Relic").slice(0, 24));
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
            <defs>
                <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stop-color="#f8ede3"/>
                    <stop offset="100%" stop-color="#dfc0a1"/>
                </linearGradient>
            </defs>
            <rect width="500" height="500" rx="36" fill="url(#bg)"/>
            <circle cx="250" cy="190" r="64" fill="#5b3420" opacity="0.12"/>
            <text x="250" y="285" text-anchor="middle" fill="#5b3420" font-family="Arial, sans-serif" font-size="34" font-weight="700">
                ${texto}
            </text>
            <text x="250" y="330" text-anchor="middle" fill="#7a5b49" font-family="Arial, sans-serif" font-size="20">
                imagem indisponivel
            </text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${svg.replace(/\n\s*/g, "").trim()}`;
}

function configurarFallbackImagens() {
    document.querySelectorAll("img").forEach((imagem) => {
        if (imagem.dataset.fallbackReady === "true") {
            return;
        }

        imagem.loading = imagem.loading || "lazy";
        imagem.decoding = "async";
        imagem.dataset.fallbackReady = "true";

        imagem.addEventListener("error", () => {
            if (imagem.dataset.fallbackApplied === "true") {
                return;
            }

            imagem.dataset.fallbackApplied = "true";
            imagem.src = gerarPlaceholderImagem(imagem.alt || "Relic");
            imagem.classList.add("image-fallback");
        });
    });
}

function criarTelaCarregamento() {
    if (document.querySelector(".page-loading")) {
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "page-loading is-visible";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <div class="page-loading__brand">RELIC</div>
        <div class="page-loading__dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <div class="page-loading__text">Carregando pagina</div>
    `;

    document.body.appendChild(overlay);

    const esconderOverlay = () => {
        window.setTimeout(() => {
            overlay.classList.remove("is-visible");
        }, 260);
    };

    if (document.readyState === "complete") {
        window.requestAnimationFrame(esconderOverlay);
        return;
    }

    window.addEventListener("load", esconderOverlay, { once: true });
}

function configurarTransicaoEntrePaginas() {
    criarTelaCarregamento();

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a[href]");

        if (!link) {
            return;
        }

        const href = link.getAttribute("href");

        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:") ||
            link.target === "_blank" ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        const destino = new URL(link.href, window.location.href);

        if (destino.origin !== window.location.origin) {
            return;
        }

        event.preventDefault();
        document.body.classList.add("is-entering");
        window.setTimeout(() => {
            window.location.href = destino.href;
        }, 430);
    });
}

function garantirContainerToast() {
    let container = document.querySelector(".toast-container");

    if (container) {
        return container;
    }

    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
}

function mostrarToast(mensagem, tipo = "success") {
    const container = garantirContainerToast();
    const toast = document.createElement("div");
    const titulo =
        tipo === "error" ? "Algo deu errado" :
        tipo === "info" ? "Aviso" :
        "Tudo certo";

    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <strong>${titulo}</strong>
        <span>${mensagem}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
    });

    window.setTimeout(() => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => toast.remove(), 260);
    }, 2800);
}

function destacarBotaoCarrinho(chave, estado = "success") {
    document.querySelectorAll(`[data-cart-key="${CSS.escape(chave)}"]`).forEach((botao) => {
        botao.classList.remove("is-added", "is-error");
        botao.classList.add(estado === "error" ? "is-error" : "is-added");

        window.setTimeout(() => {
            botao.classList.remove("is-added", "is-error");
        }, 1400);
    });
}

function adicionarCarrinho(nome, preco, imagem) {
    const produto = buscarProdutoPorNome(nome);
    const carrinho = lerCarrinho();
    const itemExistente = carrinho.find((item) => item.id && produto && item.id === produto.id);
    const estoque = obterEstoqueProduto(produto);
    const quantidadeAtual = produto ? obterQuantidadeNoCarrinho(produto.id) : 0;

    if (produto && estoque > 0 && quantidadeAtual >= estoque) {
        mostrarToast(`Nao ha mais unidades disponiveis de ${nome}.`, "error");
        destacarBotaoCarrinho(produto.id, "error");
        return false;
    }

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: produto?.id || null,
            nome,
            preco: Number(produto?.price ?? preco),
            imagem: new URL(produto?.image ?? imagem, window.location.href).href,
            quantidade: 1
        });
    }

    salvarCarrinho(carrinho);
    if (produto?.id) {
        destacarBotaoCarrinho(produto.id, "success");
    }
    mostrarToast(`${nome} foi adicionado ao carrinho.`, "success");
    carregarCarrinho();
    carregarResumoPedido();
    return true;
}

function adicionarFavoritos(nome, imagem) {
    if (!lerSessao()) {
        mostrarToast("Faça login para salvar itens nos favoritos.", "info");
        return false;
    }

    const favoritos = lerFavoritos();
    const indiceExistente = favoritos.findIndex((item) => item.nome === nome);

    if (indiceExistente >= 0) {
        favoritos.splice(indiceExistente, 1);
        salvarFavoritos(favoritos);
        atualizarBotoesFavorito();
        mostrarToast(`${nome} foi removido dos favoritos.`, "info");
        carregarFavoritos();
        return true;
    }

    favoritos.push({
        nome,
        imagem: new URL(imagem, window.location.href).href
    });

    salvarFavoritos(favoritos);
    atualizarBotoesFavorito();
    destacarBotaoFavorito(nome);
    mostrarToast(`${nome} foi salvo nos favoritos.`, "success");
    carregarFavoritos();
    return true;
}

function removerItem(index) {
    const carrinho = lerCarrinho();
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    carregarCarrinho();
    carregarResumoPedido();
    atualizarBotoesCarrinho();
}

function atualizarQuantidadeItem(index, novaQuantidade) {
    const carrinho = lerCarrinho();
    const item = carrinho[index];

    if (!item) {
        return;
    }

    const produto = item.id ? buscarProdutoPorId(item.id) : buscarProdutoPorNome(item.nome);
    const estoque = obterEstoqueProduto(produto);
    const quantidade = Math.max(1, Number(novaQuantidade || 1));

    if (estoque > 0 && quantidade > estoque) {
        mostrarToast(`O limite para ${item.nome} e ${estoque} unidade(s).`, "error");
        return;
    }

    item.quantidade = quantidade;
    salvarCarrinho(carrinho);
    carregarCarrinho();
    carregarResumoPedido();
    atualizarBotoesCarrinho();
}

function alterarQuantidadeItem(index, variacao) {
    const carrinho = lerCarrinho();
    const item = carrinho[index];

    if (!item) {
        return;
    }

    atualizarQuantidadeItem(index, Number(item.quantidade || 1) + variacao);
}

function removerFavorito(index) {
    const favoritos = lerFavoritos();
    favoritos.splice(index, 1);
    salvarFavoritos(favoritos);
    carregarFavoritos();
    atualizarBotoesFavorito();
}

function configurarFiltrosCatalogo() {
    document.querySelectorAll(".catalogo").forEach((catalogo) => {
        const filtros = catalogo.querySelector(".catalogo-filtros");
        const cards = Array.from(catalogo.querySelectorAll(".produto-card"));
        const vazio = catalogo.querySelector(".catalogo-vazio");

        if (!filtros || cards.length === 0) {
            return;
        }

        const atualizar = () => {
            const termo = normalizarTexto(filtros.querySelector('[data-filter="search"]')?.value);
            const condicao = filtros.querySelector('[data-filter="condition"]')?.value || "";
            const autenticidade = filtros.querySelector('[data-filter="authenticity"]')?.value || "";
            const disponibilidade = filtros.querySelector('[data-filter="availability"]')?.value || "";
            let visiveis = 0;

            cards.forEach((card) => {
                const textoCard = normalizarTexto(card.dataset.search);
                const correspondeTermo = !termo || textoCard.includes(termo);
                const correspondeCondicao = !condicao || card.dataset.condition === condicao;
                const correspondeAutenticidade = !autenticidade || card.dataset.authenticity === autenticidade;
                const correspondeDisponibilidade = !disponibilidade || card.dataset.availability === disponibilidade;
                const mostrar =
                    correspondeTermo &&
                    correspondeCondicao &&
                    correspondeAutenticidade &&
                    correspondeDisponibilidade;

                card.classList.toggle("is-hidden", !mostrar);

                if (mostrar) {
                    visiveis += 1;
                }
            });

            if (vazio) {
                vazio.classList.toggle("is-visible", visiveis === 0);
            }
        };

        filtros.addEventListener("input", atualizar);
        filtros.addEventListener("change", atualizar);
        atualizar();
    });
}

function carregarCarrinho() {
    const lista = document.querySelector(".lista-carrinho");
    const totalElemento = document.querySelector(".total h2");

    if (!lista || !totalElemento) {
        return;
    }

    const carrinho = lerCarrinho();

    if (carrinho.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div>
                    <h3>Seu carrinho esta vazio</h3>
                    <p>Adicione alguns itens das categorias para visualizar o resumo aqui.</p>
                </div>
            </div>
        `;
        totalElemento.textContent = "Total: R$ 0,00";
        return;
    }

    let total = 0;

    lista.innerHTML = carrinho.map((item, index) => {
        const produto = item.id ? buscarProdutoPorId(item.id) : buscarProdutoPorNome(item.nome);
        const estoque = obterEstoqueProduto(produto);
        const quantidade = Number(item.quantidade || 1);
        const subtotal = Number(item.preco) * quantidade;
        total += subtotal;

        return `
            <div class="item-carrinho">
                <img src="${item.imagem}" alt="${item.nome}">
                <div class="info">
                    <h3>${item.nome}</h3>
                    <p>Item reservado para colecionadores.</p>
                    <div class="item-carrinho-meta">
                        <span>${formatarPreco(item.preco)} cada</span>
                        <small>${estoque > 0 ? `${estoque} unidade(s) disponivel(is)` : "Estoque sob consulta"}</small>
                    </div>
                </div>
                <div class="item-carrinho-acoes">
                    <div class="quantity-control">
                        <button class="quantity-button" type="button" onclick="alterarQuantidadeItem(${index}, -1)" ${quantidade <= 1 ? "disabled" : ""}>-</button>
                        <input class="quantity-input" type="number" min="1" max="${estoque || quantidade}" value="${quantidade}" onchange="atualizarQuantidadeItem(${index}, this.value)">
                        <button class="quantity-button" type="button" onclick="alterarQuantidadeItem(${index}, 1)" ${estoque > 0 && quantidade >= estoque ? "disabled" : ""}>+</button>
                    </div>
                    <strong class="item-carrinho-subtotal">${formatarPreco(subtotal)}</strong>
                </div>
                <button class="remover" type="button" onclick="removerItem(${index})">Remover</button>
            </div>
        `;
    }).join("");

    totalElemento.textContent = `Total: ${formatarPreco(total)}`;
}

function carregarFavoritos() {
    const lista = document.querySelector(".lista-favoritos");
    const totalElemento = document.querySelector(".total h2");
    const usuario = lerSessao();

    if (!lista || !totalElemento) {
        return;
    }

    if (!usuario) {
        lista.innerHTML = `
            <div class="empty-state">
                <div>
                    <h3>Faca login para ver seus favoritos</h3>
                    <p>Entre na sua conta para salvar e acompanhar seus itens favoritos.</p>
                </div>
            </div>
        `;
        totalElemento.textContent = "Total de itens: 0";
        return;
    }

    const favoritos = lerFavoritos();

    if (favoritos.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div>
                    <h3>Voce ainda nao salvou favoritos</h3>
                    <p>Use o botao de favoritar nas paginas de produtos para montar sua selecao.</p>
                </div>
            </div>
        `;
        totalElemento.textContent = "Total de itens: 0";
        return;
    }

    lista.innerHTML = favoritos.map((item, index) => {
        const produto = buscarProdutoPorNome(item.nome);
        const href = produto ? obterHrefProduto(produto.id) : "#";
        const preco = produto ? formatarPreco(produto.price) : "Produto indisponivel";

        return `
            <div class="item-carrinho item-favorito">
                <img src="${item.imagem}" alt="${item.nome}">
                <div class="info">
                    <h3>${item.nome}</h3>
                    <p>Item salvo na sua lista de favoritos.</p>
                    <span>${preco}</span>
                </div>
                <div class="item-carrinho-acoes">
                    <a class="button-secondary" href="${href}">Ver produto</a>
                    ${produto ? `<button class="produto-acao" type="button" onclick="adicionarCarrinho('${produto.title.replace(/'/g, "\\'")}', ${produto.price}, '${produto.image}')">Comprar</button>` : ""}
                </div>
                <button class="remover" type="button" onclick="removerFavorito(${index})">Remover</button>
            </div>
        `;
    }).join("");

    totalElemento.textContent = `Total de itens: ${favoritos.length}`;
    atualizarBotoesCarrinho();
    configurarFallbackImagens();
}

function carregarResumoPedido() {
    const listaResumo = document.querySelector("#lista-resumo");
    const subtotalElemento = document.querySelector("#subtotal");
    const freteElemento = document.querySelector("#frete");
    const totalElemento = document.querySelector("#total");

    if (!listaResumo || !subtotalElemento || !freteElemento || !totalElemento) {
        return;
    }

    const carrinho = lerCarrinho();
    const frete = carrinho.length > 0 ? 25 : 0;

    if (carrinho.length === 0) {
        listaResumo.innerHTML = "<p>Seu carrinho esta vazio.</p>";
        subtotalElemento.textContent = "R$ 0,00";
        freteElemento.textContent = formatarPreco(frete);
        totalElemento.textContent = "R$ 0,00";
        return;
    }

    let subtotal = 0;

    listaResumo.innerHTML = carrinho.map((item) => {
        const quantidade = Number(item.quantidade || 1);
        const subtotalItem = Number(item.preco) * quantidade;
        subtotal += subtotalItem;
        return `
            <div class="item-resumo">
                <img src="${item.imagem}" alt="${item.nome}">
                <div>
                    <p>${item.nome}</p>
                    <small>Quantidade: ${quantidade}</small>
                    <span>${formatarPreco(subtotalItem)}</span>
                </div>
            </div>
        `;
    }).join("");

    const total = subtotal + frete;
    subtotalElemento.textContent = formatarPreco(subtotal);
    freteElemento.textContent = formatarPreco(frete);
    totalElemento.textContent = formatarPreco(total);
}

function registrarPedido(carrinho, usuario, pagamento) {
    const subtotal = carrinho.reduce((total, item) => total + (Number(item.preco) * Number(item.quantidade || 1)), 0);
    const frete = carrinho.length > 0 ? 25 : 0;
    const pedido = {
        id: `pedido-${Date.now()}`,
        userEmail: usuario?.email || "",
        createdAt: new Date().toISOString(),
        payment: pagamento,
        subtotal,
        frete,
        total: subtotal + frete,
        items: carrinho.map((item) => ({
            id: item.id,
            nome: item.nome,
            imagem: item.imagem,
            preco: Number(item.preco),
            quantidade: Number(item.quantidade || 1)
        }))
    };

    const pedidos = lerPedidos();
    pedidos.unshift(pedido);
    salvarPedidos(pedidos);
    writeJson(STORAGE_KEYS.lastOrder, pedido);
    return pedido;
}

function obterHrefRelativo(arquivo) {
    return window.location.pathname.includes("/html/") ? `./${arquivo}` : `html/${arquivo}`;
}

function obterHrefProduto(produtoId) {
    return `${obterHrefRelativo("produto.html")}?id=${produtoId}`;
}

function obterCategoriaDaPagina() {
    const path = window.location.pathname.toLowerCase();

    if (path.includes("vinil")) return "vinil";
    if (path.includes("cartas")) return "cartas";
    if (path.includes("livros")) return "livros";
    if (path.includes("jogos")) return "jogos";

    return "";
}

function obterDestaquesDaSemana() {
    return [
        buscarProdutoPorId("vinil-michael-jackson"),
        buscarProdutoPorId("carta-charizard-holo"),
        buscarProdutoPorId("livro-1984")
    ].filter(Boolean);
}

function enriquecerCardsComLinksProduto() {
    const produtos = lerProdutos();

    if (produtos.length === 0) {
        return;
    }

    document.querySelectorAll(".produto-card").forEach((card) => {
        const titulo = card.querySelector("h3")?.textContent?.trim();

        if (!titulo) {
            return;
        }

        const produto = produtos.find((item) => normalizarTexto(item.title) === normalizarTexto(titulo));

        if (!produto) {
            return;
        }

        const href = obterHrefProduto(produto.id);
        card.classList.add("produto-card--clickable");
        card.classList.add("produto-card--showcase");
        card.dataset.productHref = href;

        const info = card.querySelector(".produto-info");
        if (info && !info.querySelector(".produto-badge-hero")) {
            const selo = document.createElement("span");
            selo.className = "produto-badge-hero";
            selo.textContent = obterBadgeProduto(produto);
            info.insertAdjacentElement("afterbegin", selo);
        }

        const imagem = card.querySelector(".produto-imagem");
        if (imagem) {
            imagem.classList.add("produto-imagem--link");
        }

        const tituloElemento = card.querySelector("h3");
        if (tituloElemento) {
            tituloElemento.classList.add("produto-titulo--link");
        }

        if (!card.querySelector(".produto-detalhe-link")) {
            const preco = card.querySelector(".produto-preco");
            if (preco) {
                const link = document.createElement("a");
                link.href = href;
                link.className = "button-secondary produto-detalhe-link";
                link.textContent = "Ver detalhes";
                preco.insertAdjacentElement("afterend", link);
            }
        }

        const textoPrincipal = card.querySelector(".produto-info > p");
        if (textoPrincipal) {
            textoPrincipal.classList.add("produto-resumo-curto");
        }

        card.querySelectorAll('button[onclick*="adicionarCarrinho"]').forEach((botao) => {
            botao.dataset.cartKey = produto.id;
            botao.dataset.cartBaseLabel = botao.dataset.cartBaseLabel || botao.textContent.trim();
        });

        if (card.dataset.clickableBound === "true") {
            return;
        }

        card.addEventListener("click", (event) => {
            if (event.target.closest("button, a, input, select, label")) {
                return;
            }

            window.location.href = href;
        });

        card.dataset.clickableBound = "true";
    });
}

function configurarFeedbackDeClique() {
    document.addEventListener("click", (event) => {
        const alvo = event.target.closest(".produto-acao, .button-primary, .button-secondary, .btn-finalizar, .btn-confirmar, .remover");

        if (!alvo) {
            return;
        }

        alvo.classList.remove("was-pressed");
        requestAnimationFrame(() => {
            alvo.classList.add("was-pressed");
        });

        window.setTimeout(() => {
            alvo.classList.remove("was-pressed");
        }, 260);
    });
}

function prepararBotoesFavorito() {
    document.querySelectorAll('button[onclick*="adicionarFavoritos"]').forEach((botao) => {
        if (botao.dataset.favoriteReady === "true") {
            return;
        }

        const acao = botao.getAttribute("onclick") || "";
        const match = acao.match(/adicionarFavoritos\('([^']+)',\s*'([^']+)'\)/);

        if (!match) {
            return;
        }

        botao.dataset.favoriteName = match[1];
        botao.dataset.favoriteImage = match[2];
        botao.dataset.favoriteReady = "true";
    });
}

function prepararBotoesCarrinho() {
    document.querySelectorAll('button[onclick*="adicionarCarrinho"]').forEach((botao) => {
        if (botao.dataset.cartReady === "true") {
            return;
        }

        const acao = botao.getAttribute("onclick") || "";
        const match = acao.match(/adicionarCarrinho\('([^']+)',\s*([^,]+),\s*'([^']+)'\)/);
        const produto = match ? buscarProdutoPorNome(match[1]) : null;

        botao.dataset.cartKey = produto?.id || normalizarTexto(match?.[1] || botao.textContent);
        botao.dataset.cartBaseLabel = botao.textContent.trim();
        botao.dataset.cartReady = "true";
    });
}

function atualizarBotoesCarrinho() {
    prepararBotoesCarrinho();

    document.querySelectorAll("[data-cart-key]").forEach((botao) => {
        const chave = botao.dataset.cartKey;
        const quantidade = lerCarrinho()
            .filter((item) => (item.id || normalizarTexto(item.nome)) === chave)
            .reduce((total, item) => total + Number(item.quantidade || 1), 0);

        botao.classList.toggle("is-in-cart", quantidade > 0);
        botao.setAttribute("aria-pressed", quantidade > 0 ? "true" : "false");
        botao.textContent = quantidade > 0
            ? `No carrinho (${quantidade})`
            : (botao.dataset.cartBaseLabel || "Adicionar ao carrinho");
    });
}

function atualizarBotoesFavorito() {
    prepararBotoesFavorito();

    document.querySelectorAll("[data-favorite-name]").forEach((botao) => {
        const favorito = estaNosFavoritos(botao.dataset.favoriteName);
        botao.classList.toggle("is-favorited", favorito);
        botao.setAttribute("aria-pressed", favorito ? "true" : "false");
        botao.textContent = favorito ? "❤ Salvo" : "♡ Favoritar";
    });
}

function destacarBotaoFavorito(nome) {
    const botao = document.querySelector(`[data-favorite-name="${CSS.escape(nome)}"]`);

    if (!botao) {
        return;
    }

    botao.classList.remove("favorito-pulse");
    requestAnimationFrame(() => {
        botao.classList.add("favorito-pulse");
    });

    window.setTimeout(() => {
        botao.classList.remove("favorito-pulse");
    }, 420);
}

function renderizarHomeHighlights() {
    const heroPanel = document.querySelector(".hero-panel");
    const destaques = obterDestaquesDaSemana();

    if (!heroPanel || !document.querySelector(".hero") || destaques.length === 0) {
        return;
    }

    heroPanel.classList.add("home-highlights");
    heroPanel.innerHTML = destaques.map((produto, index) => `
        <a class="featured-home-card ${index === 0 ? "is-featured" : ""}" href="${obterHrefProduto(produto.id)}">
            <div class="featured-home-thumb">
                <img src="${produto.image}" alt="${produto.title}">
            </div>
            <div class="featured-home-copy">
                <span class="tag">${index === 0 ? "Selecao da semana" : obterBadgeProduto(produto)}</span>
                <strong>${produto.title}</strong>
                <p>${produto.summary}</p>
                <span class="featured-home-meta">${produto.creator} • ${formatarPreco(produto.price)}</span>
            </div>
        </a>
    `).join("");

    const categorySection = Array.from(document.querySelectorAll("section")).find((section) => {
        const titulo = section.querySelector(".section-head h2");
        return titulo && normalizarTexto(titulo.textContent) === "categorias";
    });

    categorySection?.remove();

    const destaqueTitulo = document.querySelector(".catalogo .section-head h2");
    const destaqueTexto = document.querySelector(".catalogo .section-head p");

    if (destaqueTitulo) {
        destaqueTitulo.textContent = "Destaques da semana";
    }

    if (destaqueTexto) {
        destaqueTexto.textContent = "Uma selecao rotativa com itens fortes, claros e prontos para exploracao.";
    }

    let indiceAtual = 0;
    window.setInterval(() => {
        indiceAtual = (indiceAtual + 1) % destaques.length;
        const cards = heroPanel.querySelectorAll(".featured-home-card");
        cards.forEach((card, index) => {
            card.classList.toggle("is-featured", index === indiceAtual);
        });
    }, 3500);
}

function renderizarDestaqueDaCategoria() {
    const heroPanel = document.querySelector(".page-hero-panel");
    const categoria = obterCategoriaDaPagina();

    if (!heroPanel || !categoria) {
        return;
    }

    const produto = lerProdutos().find((item) => item.category === categoria);

    if (!produto) {
        return;
    }

    heroPanel.innerHTML = `
        <a class="featured-side-card" href="${obterHrefProduto(produto.id)}">
            <div class="featured-side-thumb">
                <img src="${produto.image}" alt="${produto.title}">
            </div>
            <div class="featured-side-copy">
                <span class="tag">${obterBadgeProduto(produto)}</span>
                <strong>${produto.title}</strong>
                <p>${produto.summary}</p>
                <ul class="featured-side-list">
                    <li><strong>${produto.creatorLabel}:</strong> ${produto.creator}</li>
                    <li><strong>Estado:</strong> ${produto.condition}</li>
                    <li><strong>Autenticidade:</strong> ${produto.authenticity}</li>
                </ul>
                <span class="featured-side-price">${formatarPreco(produto.price)}</span>
            </div>
        </a>
    `;
}

function configurarSugestoesDeBusca() {
    const produtos = lerProdutos();

    if (produtos.length === 0) {
        return;
    }

    document.querySelectorAll('.nav-actions input[type="search"], .acoes-topo input[type="text"], .acoes-topo input[type="search"]').forEach((input) => {
        if (input.dataset.suggestionsReady === "true") {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "search-box";
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const painel = document.createElement("div");
        painel.className = "search-suggestions";
        wrapper.appendChild(painel);

        const renderizar = (termo) => {
            const termoNormalizado = normalizarTexto(termo);
            const resultados = produtos
                .filter((produto) => {
                    const referencia = normalizarTexto(`${produto.title} ${produto.creator} ${produto.category}`);
                    return !termoNormalizado || referencia.includes(termoNormalizado);
                })
                .slice(0, 3);

            if (resultados.length === 0) {
                painel.classList.remove("is-visible");
                painel.innerHTML = "";
                return;
            }

            painel.innerHTML = `
                <div class="search-suggestions-title">${termoNormalizado ? "Resultados de busca" : "Sugestoes da loja"}</div>
                ${resultados.map((produto) => `
                    <a class="search-suggestion-item" href="${obterHrefProduto(produto.id)}">
                        <div class="search-suggestion-thumb">
                            <img src="${produto.image}" alt="${produto.title}">
                        </div>
                        <div class="search-suggestion-copy">
                            <strong>${produto.title}</strong>
                            <span>${produto.creator}</span>
                            <small>${formatarPreco(produto.price)}</small>
                        </div>
                    </a>
                `).join("")}
            `;

            painel.classList.add("is-visible");
        };

        input.addEventListener("focus", () => renderizar(input.value));
        input.addEventListener("input", () => renderizar(input.value));

        document.addEventListener("click", (event) => {
            if (!wrapper.contains(event.target)) {
                painel.classList.remove("is-visible");
            }
        });

        input.dataset.suggestionsReady = "true";
    });
}

function atualizarLinksDeAutenticacao() {
    const usuario = lerSessao();

    document.querySelectorAll("[data-auth-link]").forEach((link) => {
        if (usuario) {
            link.textContent = usuario.name ? `Ola, ${usuario.name.split(" ")[0]} ▾` : "Conta ▾";
            link.classList.add("ativo");
            link.setAttribute("href", "#");
            link.dataset.accountTrigger = "true";
            link.setAttribute("aria-haspopup", "menu");
            link.setAttribute("aria-expanded", "false");
        } else {
            link.textContent = "Entrar";
            link.classList.remove("ativo");
            link.setAttribute("href", obterHrefRelativo("entra.html"));
            delete link.dataset.accountTrigger;
            link.removeAttribute("aria-haspopup");
            link.removeAttribute("aria-expanded");
        }
    });

    document.querySelectorAll(".barNavegacao a[href*='favoritos.html']").forEach((link) => {
        link.hidden = true;
        link.setAttribute("aria-hidden", "true");
    });

    atualizarBotoesFavorito();
    configurarMenuConta();
}

function configurarMenuConta() {
    const usuario = lerSessao();
    const trigger = document.querySelector("[data-account-trigger='true']");
    let menu = document.querySelector(".account-menu");

    if (!usuario || !trigger) {
        menu?.remove();
        return;
    }

    if (!menu) {
        menu = document.createElement("div");
        menu.className = "account-menu";
        menu.setAttribute("role", "menu");
        menu.innerHTML = `
            <a href="${obterHrefRelativo("perfil.html")}" role="menuitem">Meu perfil</a>
            <a href="${obterHrefRelativo("favoritos.html")}" role="menuitem">Favoritos</a>
            <a href="${obterHrefRelativo("pedidos.html")}" role="menuitem">Pedidos</a>
            <button type="button" data-account-logout role="menuitem">Sair</button>
        `;

        trigger.parentElement?.appendChild(menu);

        menu.querySelector("[data-account-logout]")?.addEventListener("click", () => {
            limparSessao();
            atualizarLinksDeAutenticacao();
            mostrarToast("Voce saiu da sua conta.", "info");
            window.setTimeout(() => {
                window.location.href = obterHrefRelativo("entra.html");
            }, 250);
        });
    }

    if (trigger.dataset.accountBound === "true") {
        return;
    }

    trigger.addEventListener("click", (event) => {
        if (!lerSessao()) {
            return;
        }

        event.preventDefault();
        menu.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
    });

    document.addEventListener("click", (event) => {
        if (!menu || !menu.classList.contains("is-open")) {
            return;
        }

        if (event.target === trigger || trigger.contains(event.target) || menu.contains(event.target)) {
            return;
        }

        menu.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
    });

    trigger.dataset.accountBound = "true";
}

function alternarAbaAutenticacao(targetId) {
    document.querySelectorAll(".auth-tab").forEach((botao) => {
        botao.classList.toggle("is-active", botao.dataset.authTarget === targetId);
    });

    document.querySelectorAll(".auth-panel").forEach((painel) => {
        painel.classList.toggle("is-hidden", painel.id !== targetId);
    });
}

function mostrarFeedbackAuth(mensagem, tipo = "") {
    const feedback = document.querySelector("#auth-feedback");

    if (!feedback) {
        return;
    }

    if (!mensagem) {
        feedback.textContent = "";
        feedback.className = "auth-feedback";
        return;
    }

    feedback.textContent = mensagem;
    feedback.className = `auth-feedback is-visible ${tipo ? `is-${tipo}` : ""}`.trim();
}

function marcarCamposLoginComErro(ativo) {
    document.querySelectorAll("#login-form input").forEach((campo) => {
        campo.classList.toggle("is-invalid", ativo);
    });
}

function atualizarCardSessao() {
    const usuario = lerSessao();
    const card = document.querySelector("#auth-session-card");
    const texto = document.querySelector("#auth-session-text");
    const paineis = document.querySelectorAll(".auth-panel");
    const abas = document.querySelector(".auth-switch");

    if (!card || !texto) {
        return;
    }

    if (usuario) {
        texto.textContent = `${usuario.name} está logado com ${usuario.email}. Se quiser, você pode seguir direto para a finalização da compra.`;
        card.classList.remove("is-hidden");
        paineis.forEach((painel) => painel.classList.add("is-hidden"));
        abas?.classList.add("is-hidden");
        return;
    }

    card.classList.add("is-hidden");
    abas?.classList.remove("is-hidden");
    alternarAbaAutenticacao("login-panel");
}

function cadastrarUsuario(dados) {
    const usuarios = lerUsuarios();
    const email = normalizarTexto(dados.email);

    if (usuarios.some((usuario) => normalizarTexto(usuario.email) === email)) {
        return { ok: false, mensagem: "Já existe uma conta cadastrada com este e-mail." };
    }

    const novoUsuario = {
        id: Date.now(),
        name: dados.name.trim(),
        email: dados.email.trim(),
        password: dados.password
    };

    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);
    salvarSessao({
        id: novoUsuario.id,
        name: novoUsuario.name,
        email: novoUsuario.email
    });

    return { ok: true };
}

function autenticarUsuario(email, senha) {
    const usuarios = lerUsuarios();

    return usuarios.find((usuario) =>
        normalizarTexto(usuario.email) === normalizarTexto(email) &&
        usuario.password === senha
    );
}

function irParaDestinoPosLogin() {
    const destino = lerRedirectCheckout() || "./finalizar-compra.html";
    limparRedirectCheckout();
    window.location.href = destino;
}

function configurarTelaDeLogin() {
    if (document.body.dataset.page !== "auth") {
        return;
    }

    const loginForm = document.querySelector("#login-form");
    const registerForm = document.querySelector("#register-form");
    const logoutButton = document.querySelector("#logout-button");

    document.querySelectorAll(".auth-tab").forEach((botao) => {
        botao.addEventListener("click", () => {
            mostrarFeedbackAuth("");
            marcarCamposLoginComErro(false);
            alternarAbaAutenticacao(botao.dataset.authTarget);
        });
    });

    atualizarCardSessao();

    loginForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const dados = new FormData(loginForm);
        const usuario = autenticarUsuario(dados.get("email"), dados.get("password"));

        if (!usuario) {
            marcarCamposLoginComErro(true);
            mostrarFeedbackAuth("E-mail ou senha inválidos. Confira os dados e tente novamente.", "error");
            mostrarToast("Login não realizado. Verifique seu e-mail e sua senha.", "error");
            return;
        }

        marcarCamposLoginComErro(false);
        salvarSessao({
            id: usuario.id,
            name: usuario.name,
            email: usuario.email
        });

        mostrarFeedbackAuth("Login realizado com sucesso. Redirecionando para a compra...", "success");
        atualizarLinksDeAutenticacao();
        mostrarToast(`Bem-vindo de volta, ${usuario.name.split(" ")[0]}.`, "success");
        window.setTimeout(irParaDestinoPosLogin, 650);
    });

    registerForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const dados = Object.fromEntries(new FormData(registerForm).entries());

        if (dados.password !== dados.confirmPassword) {
            mostrarFeedbackAuth("As senhas não coincidem. Tente novamente.", "error");
            mostrarToast("As senhas não conferem. Ajuste o cadastro.", "error");
            return;
        }

        const resultado = cadastrarUsuario(dados);

        if (!resultado.ok) {
            mostrarFeedbackAuth(resultado.mensagem, "error");
            mostrarToast(resultado.mensagem, "error");
            return;
        }

        mostrarFeedbackAuth("Conta criada com sucesso. Você será levado para o checkout.", "success");
        atualizarLinksDeAutenticacao();
        mostrarToast("Cadastro realizado com sucesso.", "success");
        window.setTimeout(irParaDestinoPosLogin, 650);
    });

    logoutButton?.addEventListener("click", () => {
        limparSessao();
        atualizarCardSessao();
        atualizarLinksDeAutenticacao();
        mostrarFeedbackAuth("Sessão encerrada com sucesso.", "success");
        mostrarToast("Você saiu da sua conta.", "info");
    });

    loginForm?.querySelectorAll("input").forEach((campo) => {
        campo.addEventListener("input", () => {
            marcarCamposLoginComErro(false);
        });
    });
}

function redirecionarParaLogin() {
    salvarRedirectCheckout("./finalizar-compra.html");
    mostrarToast("Para finalizar a compra, faça login primeiro.", "info");
    window.setTimeout(() => {
        window.location.href = "./entra.html";
    }, 350);
}

function configurarCheckoutNoCarrinho() {
    const linkCheckout = document.querySelector("[data-checkout-link]");

    if (!linkCheckout) {
        return;
    }

    linkCheckout.addEventListener("click", (event) => {
        const carrinho = lerCarrinho();

        if (carrinho.length === 0) {
            event.preventDefault();
            mostrarToast("Seu carrinho está vazio.", "info");
            return;
        }

        if (!lerSessao()) {
            event.preventDefault();
            redirecionarParaLogin();
        }
    });
}

function atualizarCamposPagamento(tipo) {
    const grupos = {
        cartao: document.querySelector("#card-fields"),
        pix: document.querySelector("#pix-fields"),
        boleto: document.querySelector("#boleto-fields")
    };

    Object.entries(grupos).forEach(([chave, grupo]) => {
        if (!grupo) {
            return;
        }

        const ativo = chave === tipo;
        grupo.classList.toggle("is-hidden", !ativo);
        grupo.querySelectorAll("[data-payment-required]").forEach((campo) => {
            campo.required = ativo;
        });
    });

    const hint = document.querySelector("#payment-hint");

    if (!hint) {
        return;
    }

    if (tipo === "pix") {
        hint.textContent = "Informe a chave Pix e os dados do pagador para seguir com a compra.";
        return;
    }

    if (tipo === "boleto") {
        hint.textContent = "Preencha os dados para receber o boleto e concluir o pedido.";
        return;
    }

    hint.textContent = "Preencha os dados do cartão para concluir o pagamento.";
}

function preencherCheckoutComSessao() {
    const usuario = lerSessao();

    if (!usuario) {
        return;
    }

    const nome = document.querySelector("#nome");
    const email = document.querySelector("#email");
    const pixNome = document.querySelector("#pix-nome");
    const boletoEmail = document.querySelector("#boleto-email");

    if (nome && !nome.value) {
        nome.value = usuario.name || "";
    }

    if (email && !email.value) {
        email.value = usuario.email || "";
    }

    if (pixNome && !pixNome.value) {
        pixNome.value = usuario.name || "";
    }

    if (boletoEmail && !boletoEmail.value) {
        boletoEmail.value = usuario.email || "";
    }
}

function somenteDigitos(valor) {
    return (valor || "").replace(/\D/g, "");
}

function formatarCpf(valor) {
    const digitos = somenteDigitos(valor).slice(0, 11);
    return digitos
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatarTelefone(valor) {
    const digitos = somenteDigitos(valor).slice(0, 11);

    if (digitos.length <= 2) {
        return digitos.replace(/^(\d{0,2})/, "($1");
    }

    if (digitos.length <= 7) {
        return digitos.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }

    return digitos.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
}

function formatarCep(valor) {
    const digitos = somenteDigitos(valor).slice(0, 8);
    return digitos.replace(/^(\d{5})(\d{0,3}).*/, "$1-$2").replace(/-$/, "");
}

function formatarCartao(valor) {
    const digitos = somenteDigitos(valor).slice(0, 16);
    return digitos.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatarValidade(valor) {
    const digitos = somenteDigitos(valor).slice(0, 4);
    return digitos.replace(/^(\d{2})(\d{0,2})/, "$1/$2").replace(/\/$/, "");
}

function atualizarFeedbackCep(mensagem, tipo = "") {
    const feedback = document.querySelector("#cep-feedback");

    if (!feedback) {
        return;
    }

    feedback.textContent = mensagem;
    feedback.classList.remove("is-error", "is-success");

    if (tipo) {
        feedback.classList.add(`is-${tipo}`);
    }
}

async function buscarCep(cep) {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    if (!resposta.ok) {
        throw new Error("CEP nao encontrado");
    }

    const dados = await resposta.json();

    if (dados.erro) {
        throw new Error("CEP invalido");
    }

    return dados;
}

function preencherEnderecoPorCep(dados) {
    const mapa = {
        rua: dados.logradouro || "",
        bairro: dados.bairro || "",
        cidade: dados.localidade || "",
        estado: dados.uf || ""
    };

    Object.entries(mapa).forEach(([id, valor]) => {
        const campo = document.querySelector(`#${id}`);
        if (campo && valor) {
            campo.value = valor;
        }
    });
}

function configurarMascarasCheckout() {
    const cpf = document.querySelector("#cpf");
    const telefone = document.querySelector("#telefone");
    const cartao = document.querySelector("#cartao");
    const cep = document.querySelector("#cep");
    const boletoCpf = document.querySelector("#boleto-cpf");
    const validade = document.querySelector("#validade");
    const cvv = document.querySelector("#cvv");

    cpf?.addEventListener("input", () => {
        cpf.value = formatarCpf(cpf.value);
    });

    boletoCpf?.addEventListener("input", () => {
        boletoCpf.value = formatarCpf(boletoCpf.value);
    });

    telefone?.addEventListener("input", () => {
        telefone.value = formatarTelefone(telefone.value);
    });

    cartao?.addEventListener("input", () => {
        cartao.value = formatarCartao(cartao.value);
    });

    validade?.addEventListener("input", () => {
        validade.value = formatarValidade(validade.value);
    });

    cvv?.addEventListener("input", () => {
        cvv.value = somenteDigitos(cvv.value).slice(0, 4);
    });

    cep?.addEventListener("input", () => {
        cep.value = formatarCep(cep.value);
    });

    cep?.addEventListener("blur", async () => {
        const cepLimpo = somenteDigitos(cep.value);

        if (cepLimpo.length !== 8) {
            atualizarFeedbackCep("Digite um CEP valido para preencher o endereco automaticamente.", "error");
            return;
        }

        atualizarFeedbackCep("Buscando endereco...", "success");

        try {
            const dados = await buscarCep(cepLimpo);
            preencherEnderecoPorCep(dados);
            atualizarFeedbackCep("Endereco preenchido automaticamente pelo CEP.", "success");
        } catch (error) {
            atualizarFeedbackCep("Nao foi possivel localizar esse CEP. Confira e tente novamente.", "error");
            mostrarToast("CEP nao encontrado. Confira os numeros digitados.", "error");
        }
    });
}

function configurarCheckout() {
    if (document.body.dataset.page !== "checkout") {
        return;
    }

    const guard = document.querySelector("#checkout-guard");
    const formulario = document.querySelector("#checkout-form");
    const botao = document.querySelector(".btn-confirmar");
    const carrinho = lerCarrinho();
    const usuario = lerSessao();

    if (!usuario) {
        if (guard) {
            guard.textContent = "Você precisa fazer login antes de finalizar a compra. Redirecionando...";
            guard.classList.add("is-visible");
        }

        salvarRedirectCheckout("./finalizar-compra.html");
        window.setTimeout(() => {
            window.location.href = "./entra.html";
        }, 900);
        return;
    }

    if (carrinho.length === 0) {
        if (guard) {
            guard.textContent = "Seu carrinho está vazio. Adicione itens antes de finalizar a compra.";
            guard.classList.add("is-visible");
        }

        botao?.setAttribute("disabled", "disabled");
        return;
    }

    preencherCheckoutComSessao();
    configurarMascarasCheckout();

    document.querySelectorAll('input[name="pagamento"]').forEach((radio) => {
        radio.addEventListener("change", () => atualizarCamposPagamento(radio.value));
    });

    atualizarCamposPagamento(document.querySelector('input[name="pagamento"]:checked')?.value || "cartao");

    formulario?.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!formulario.reportValidity()) {
            mostrarToast("Preencha os campos obrigatórios antes de confirmar o pedido.", "error");
            return;
        }

        const formaPagamento = document.querySelector('input[name="pagamento"]:checked')?.value || "cartao";
        registrarPedido(carrinho, usuario, formaPagamento);
        localStorage.removeItem(STORAGE_KEYS.cart);
        limparRedirectCheckout();
        mostrarToast("Pedido confirmado com sucesso.", "success");
        window.setTimeout(() => {
            window.location.href = "./compra-realizada.html";
        }, 500);
    });
}

function configurarPerfil() {
    if (document.body.dataset.page !== "profile") {
        return;
    }

    const usuario = lerSessao();
    const nome = document.querySelector("#profile-name");
    const email = document.querySelector("#profile-email");
    const status = document.querySelector("#profile-status");
    const logoutButton = document.querySelector("#profile-logout");

    if (!usuario) {
        mostrarToast("Faça login para acessar seu perfil.", "info");
        window.setTimeout(() => {
            window.location.href = "./entra.html";
        }, 350);
        return;
    }

    if (nome) {
        nome.textContent = usuario.name || "Usuario";
    }

    if (email) {
        email.textContent = usuario.email || "-";
    }

    if (status) {
        status.textContent = "Sessão ativa";
    }

    logoutButton?.addEventListener("click", () => {
        limparSessao();
        atualizarLinksDeAutenticacao();
        mostrarToast("Você saiu da sua conta.", "info");
        window.setTimeout(() => {
            window.location.href = "./entra.html";
        }, 350);
    });
}

function renderizarPedidos() {
    if (document.body.dataset.page !== "orders") {
        return;
    }

    const usuario = lerSessao();
    const lista = document.querySelector(".lista-pedidos");
    const resumo = document.querySelector("#orders-count");

    if (!usuario) {
        mostrarToast("Faca login para acessar seus pedidos.", "info");
        window.setTimeout(() => {
            window.location.href = "./entra.html";
        }, 350);
        return;
    }

    if (!lista || !resumo) {
        return;
    }

    const pedidos = lerPedidos().filter((pedido) => pedido.userEmail === usuario.email);
    resumo.textContent = `Total de pedidos: ${pedidos.length}`;

    if (pedidos.length === 0) {
        lista.innerHTML = `
            <div class="empty-state">
                <div>
                    <h3>Voce ainda nao realizou pedidos</h3>
                    <p>Quando voce concluir uma compra, o historico aparecera aqui.</p>
                </div>
            </div>
        `;
        return;
    }

    lista.innerHTML = pedidos.map((pedido) => `
        <article class="pedido-card">
            <div class="pedido-head">
                <div>
                    <span class="mini-tag">Pedido</span>
                    <h3>${pedido.id}</h3>
                </div>
                <strong>${formatarPreco(pedido.total)}</strong>
            </div>
            <p class="pedido-meta">${new Date(pedido.createdAt).toLocaleDateString("pt-BR")} • ${pedido.items.length} item(ns) • ${pedido.payment.toUpperCase()}</p>
            <div class="pedido-items">
                ${pedido.items.map((item) => `
                    <a class="pedido-item" href="${item.id ? obterHrefProduto(item.id) : "#"}">
                        <img src="${item.imagem}" alt="${item.nome}">
                        <div>
                            <strong>${item.nome}</strong>
                            <span>Quantidade: ${item.quantidade}</span>
                        </div>
                    </a>
                `).join("")}
            </div>
        </article>
    `).join("");
    configurarFallbackImagens();
}

function renderizarCompraRealizada() {
    if (document.body.dataset.page !== "success") {
        return;
    }

    const pedido = readJson(STORAGE_KEYS.lastOrder, null);
    const resumo = document.querySelector("#success-summary");
    const lista = document.querySelector("#success-items");

    if (!pedido || !resumo || !lista) {
        return;
    }

    resumo.innerHTML = `
        <div class="success-stat">
            <span>Pedido</span>
            <strong>${pedido.id}</strong>
        </div>
        <div class="success-stat">
            <span>Total</span>
            <strong>${formatarPreco(pedido.total)}</strong>
        </div>
        <div class="success-stat">
            <span>Pagamento</span>
            <strong>${pedido.payment.toUpperCase()}</strong>
        </div>
    `;

    lista.innerHTML = pedido.items.map((item) => `
        <a class="pedido-item" href="${item.id ? obterHrefProduto(item.id) : "#"}">
            <img src="${item.imagem}" alt="${item.nome}">
            <div>
                <strong>${item.nome}</strong>
                <span>Quantidade: ${item.quantidade}</span>
            </div>
        </a>
    `).join("");
    configurarFallbackImagens();
}

function comprarAgora(produtoId) {
    const produto = buscarProdutoPorId(produtoId);

    if (!produto) {
        mostrarToast("Produto não encontrado.", "error");
        return;
    }

    const adicionou = adicionarCarrinho(produto.title, produto.price, produto.image);
    if (adicionou) {
        window.setTimeout(() => {
            window.location.href = obterHrefRelativo("carrinho.html");
        }, 350);
    }
}

function renderizarProduto() {
    if (document.body.dataset.page !== "product") {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const produtoId = params.get("id");
    const produto = buscarProdutoPorId(produtoId);

    const container = document.querySelector("#product-detail");

    if (!container) {
        return;
    }

    if (!produto) {
        container.innerHTML = `
            <section class="carrinho-container">
                <div class="empty-state">
                    <div>
                        <h3>Produto não encontrado</h3>
                        <p>Volte para o catalogo e selecione outro item.</p>
                    </div>
                </div>
            </section>
        `;
        return;
    }

    document.title = `${produto.title} | Relic`;

    const relacionados = obterRelacionados(produto);
    const categoriaLabel = produto.category.charAt(0).toUpperCase() + produto.category.slice(1);

    container.innerHTML = `
        <section class="produto-detalhe-layout">
            <article class="produto-detalhe-main">
                <div class="produto-detalhe-galeria">
                    <div class="produto-detalhe-imagem">
                        <img src="${produto.image}" alt="${produto.title}">
                    </div>
                </div>

                <div class="produto-detalhe-conteudo">
                    <span class="tag">${categoriaLabel}</span>
                    <h1>${produto.title}</h1>
                    <p class="produto-detalhe-criador"><strong>${produto.creatorLabel}:</strong> ${produto.creator}</p>
                    <p class="produto-detalhe-resumo">${produto.summary}</p>

                    <div class="produto-detalhe-info">
                        <div class="detalhe-chip"><strong>Estado:</strong> ${produto.condition}</div>
                        <div class="detalhe-chip"><strong>Autenticidade:</strong> ${produto.authenticity}</div>
                        <div class="detalhe-chip"><strong>Disponibilidade:</strong> ${produto.availability}</div>
                    </div>

                    <section class="produto-detalhe-texto">
                        <h2>Sobre o item</h2>
                        <p>${produto.details}</p>
                    </section>
                </div>
            </article>

            <aside class="produto-detalhe-compra">
                <div class="produto-detalhe-box">
                    <span class="produto-preco produto-preco-destaque">${formatarPreco(produto.price)}</span>
                    <p class="produto-detalhe-disponibilidade">Disponibilidade: ${produto.availability}</p>
                    <button class="button-primary produto-detalhe-botao" type="button" onclick="comprarAgora('${produto.id}')">Comprar agora</button>
                    <button
                        class="button-secondary produto-detalhe-botao"
                        type="button"
                        data-cart-key="${produto.id}"
                        data-cart-base-label="Adicionar ao carrinho"
                        onclick="adicionarCarrinho('${produto.title.replace(/'/g, "\\'")}', ${produto.price}, '${produto.image}')"
                    >Adicionar ao carrinho</button>
                    <button
                        class="button-secondary produto-detalhe-botao"
                        type="button"
                        data-favorite-name="${produto.title}"
                        data-favorite-image="${produto.image}"
                        onclick="adicionarFavoritos('${produto.title.replace(/'/g, "\\'")}', '${produto.image}')"
                    >Salvar</button>
                </div>

                <div class="produto-relacionados">
                    <div class="section-head">
                        <div>
                            <h2>Relacionados</h2>
                            <p>Outros itens da mesma categoria.</p>
                        </div>
                    </div>

                    <div class="produto-relacionados-grid">
                        ${relacionados.map((item) => `
                            <a class="produto-relacionado-card" href="${obterHrefProduto(item.id)}">
                                <div class="produto-relacionado-imagem">
                                    <img src="${item.image}" alt="${item.title}">
                                </div>
                                <div>
                                    <h3>${item.title}</h3>
                                    <p>${item.creator}</p>
                                    <span>${formatarPreco(item.price)}</span>
                                </div>
                            </a>
                        `).join("")}
                    </div>
                </div>
            </aside>
        </section>
    `;

    atualizarBotoesFavorito();
    atualizarBotoesCarrinho();
    configurarFallbackImagens();
}

function atualizarBotoesFavorito() {
    prepararBotoesFavorito();
    const usuario = lerSessao();

    document.querySelectorAll("[data-favorite-name]").forEach((botao) => {
        const favorito = estaNosFavoritos(botao.dataset.favoriteName);
        botao.classList.toggle("is-favorited", favorito);
        botao.setAttribute("aria-pressed", favorito ? "true" : "false");
        botao.textContent = !usuario ? "Entrar para salvar" : (favorito ? "Salvo" : "Salvar");
    });
}

function renderizarHomeHighlights() {
    const heroPanel = document.querySelector(".hero-panel");
    const destaques = obterDestaquesDaSemana();

    if (!heroPanel || !document.querySelector(".hero") || destaques.length === 0) {
        return;
    }

    heroPanel.classList.add("home-highlights");
    heroPanel.innerHTML = destaques.map((produto, index) => `
        <a class="featured-home-card ${index === 0 ? "is-featured" : ""}" href="${obterHrefProduto(produto.id)}">
            <div class="featured-home-thumb">
                <img src="${produto.image}" alt="${produto.title}">
            </div>
            <div class="featured-home-copy">
                <span class="tag">${index === 0 ? "Selecao da semana" : obterBadgeProduto(produto)}</span>
                <strong>${produto.title}</strong>
                <p>${produto.summary}</p>
                <span class="featured-home-meta">${produto.creator} - ${formatarPreco(produto.price)}</span>
            </div>
        </a>
    `).join("");

    const categorySection = Array.from(document.querySelectorAll("section")).find((section) => {
        const titulo = section.querySelector(".section-head h2");
        return titulo && normalizarTexto(titulo.textContent) === "categorias";
    });

    categorySection?.remove();

    const destaqueTitulo = document.querySelector(".catalogo .section-head h2");
    const destaqueTexto = document.querySelector(".catalogo .section-head p");

    if (destaqueTitulo) {
        destaqueTitulo.textContent = "Destaques da semana";
    }

    if (destaqueTexto) {
        destaqueTexto.textContent = "Uma selecao rotativa com itens fortes, claros e prontos para exploracao.";
    }

    let indiceAtual = 0;
    window.setInterval(() => {
        indiceAtual = (indiceAtual + 1) % destaques.length;
        const cards = heroPanel.querySelectorAll(".featured-home-card");
        cards.forEach((card, index) => {
            card.classList.toggle("is-featured", index === indiceAtual);
        });
    }, 3500);
}

function animarTrocaDeTema(origem, tema) {
    if (!origem) {
        aplicarTema(tema);
        return;
    }

    const rect = origem.getBoundingClientRect();
    const overlay = document.createElement("div");
    overlay.className = `theme-flash theme-flash--${tema}`;
    overlay.style.setProperty("--theme-flash-x", `${rect.left + rect.width / 2}px`);
    overlay.style.setProperty("--theme-flash-y", `${rect.top + rect.height / 2}px`);
    document.body.appendChild(overlay);
    document.body.classList.add("theme-transitioning");

    requestAnimationFrame(() => {
        overlay.classList.add("is-active");
        aplicarTema(tema);
    });

    window.setTimeout(() => {
        overlay.classList.remove("is-active");
        document.body.classList.remove("theme-transitioning");
        window.setTimeout(() => overlay.remove(), 420);
    }, 320);
}

function aplicarTema(tema) {
    const modoEscuro = tema === "dark";
    document.body.classList.toggle("theme-dark", modoEscuro);
    writeJson(STORAGE_KEYS.theme, modoEscuro ? "dark" : "light");

    const toggle = document.querySelector(".theme-toggle");
    if (toggle) {
        toggle.setAttribute("aria-pressed", modoEscuro ? "true" : "false");
        toggle.textContent = modoEscuro ? "🌙" : "☀️";
        toggle.setAttribute("aria-label", modoEscuro ? "Alternar para modo claro" : "Alternar para modo escuro");
        toggle.setAttribute("title", modoEscuro ? "Modo escuro ativo" : "Modo claro ativo");
    }
}

function configurarTema() {
    const navActions = document.querySelector(".nav-actions");
    const temaSalvo = readJson(STORAGE_KEYS.theme, "light");

    if (navActions && !navActions.querySelector(".theme-toggle")) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "theme-toggle";
        toggle.textContent = "☀️";
        navActions.appendChild(toggle);

        toggle.addEventListener("click", () => {
            const temaAtual = document.body.classList.contains("theme-dark") ? "dark" : "light";
            animarTrocaDeTema(toggle, temaAtual === "dark" ? "light" : "dark");
        });
    }

    aplicarTema(temaSalvo);
}

document.addEventListener("DOMContentLoaded", () => {
    configurarTema();
    configurarTransicaoEntrePaginas();
    configurarFiltrosCatalogo();
    enriquecerCardsComLinksProduto();
    configurarFeedbackDeClique();
    atualizarBotoesCarrinho();
    atualizarBotoesFavorito();
    renderizarHomeHighlights();
    renderizarDestaqueDaCategoria();
    configurarSugestoesDeBusca();
    configurarFallbackImagens();
    atualizarLinksDeAutenticacao();
    carregarCarrinho();
    carregarFavoritos();
    carregarResumoPedido();
    configurarTelaDeLogin();
    configurarCheckoutNoCarrinho();
    configurarCheckout();
    configurarPerfil();
    renderizarPedidos();
    renderizarCompraRealizada();
    renderizarProduto();
});
