function lerCarrinho() {
    try {
        return JSON.parse(localStorage.getItem("carrinho")) || [];
    } catch (erro) {
        return [];
    }
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

function normalizarTexto(valor) {
    return (valor || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
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

function salvarCarrinho(carrinho) {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function formatarPreco(preco) {
    return Number(preco).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function adicionarCarrinho(nome, preco, imagem) {
    const carrinho = lerCarrinho();

    carrinho.push({
        nome,
        preco: Number(preco),
        imagem: new URL(imagem, window.location.href).href
    });

    salvarCarrinho(carrinho);
    alert("Produto adicionado ao carrinho.");
}

function removerItem(index) {
    const carrinho = lerCarrinho();
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    carregarCarrinho();
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
    lista.innerHTML = carrinho
        .map((item, index) => {
            total += Number(item.preco);
            return `
                <div class="item-carrinho">
                    <img src="${item.imagem}" alt="${item.nome}">
                    <div class="info">
                        <h3>${item.nome}</h3>
                        <p>Item reservado para colecionadores.</p>
                        <span>${formatarPreco(item.preco)}</span>
                    </div>
                    <button class="remover" type="button" onclick="removerItem(${index})">Remover</button>
                </div>
            `;
        })
        .join("");

    totalElemento.textContent = `Total: ${formatarPreco(total)}`;
}

document.addEventListener("DOMContentLoaded", () => {
    configurarTransicaoEntrePaginas();
    configurarFiltrosCatalogo();
    carregarCarrinho();
    carregarResumoPedido();
});


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
    listaResumo.innerHTML = "<p>Seu carrinho está vazio.</p>";
    subtotalElemento.textContent = "R$ 0,00";
    freteElemento.textContent = formatarPreco(frete);
    totalElemento.textContent = "R$ 0,00";
    return;
  }

  let subtotal = 0;

  listaResumo.innerHTML = carrinho.map((item) => {
    subtotal += Number(item.preco);

    return `
      <div class="item-resumo">
        <img src="${item.imagem}" alt="${item.nome}">
        <div>
          <p>${item.nome}</p>
          <span>${formatarPreco(item.preco)}</span>
        </div>
      </div>
    `;
  }).join("");

  const total = subtotal + frete;

  subtotalElemento.textContent = formatarPreco(subtotal);
  freteElemento.textContent = formatarPreco(frete);
  totalElemento.textContent = formatarPreco(total);
}