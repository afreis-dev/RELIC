const input = document.getElementById("pesquisa");
const cards = document.querySelectorAll(".card-produto");

function distanciaLevenshtein(a, b) {
    const matriz = [];

    for (let i = 0; i <= b.length; i++) {
        matriz[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matriz[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matriz[i][j] = matriz[i - 1][j - 1];
            } else {
                matriz[i][j] = Math.min(
                    matriz[i - 1][j - 1] + 1,
                    matriz[i][j - 1] + 1,
                    matriz[i - 1][j] + 1
                );
            }
        }
    }

    return matriz[b.length][a.length];
}

function nomesParecidos(textoDigitado, nomeProduto) {
    const busca = textoDigitado.toLowerCase().trim();
    const nome = nomeProduto.toLowerCase().trim();

    if (nome.includes(busca)) {
        return true;
    }

    const palavrasBusca = busca.split(" ");
    const palavrasNome = nome.split(" ");

    for (let palavraBusca of palavrasBusca) {
        for (let palavraNome of palavrasNome) {
            const distancia = distanciaLevenshtein(palavraBusca, palavraNome);

            if (distancia <= 2) {
                return true;
            }
        }
    }

    return false;
}

function montarCaminhoPagina(arquivo) {
    const caminhoAtual = window.location.pathname.toLowerCase();

    if (caminhoAtual.includes("/html/")) {
        return arquivo;
    } else {
        return "html/" + arquivo;
    }
}

if (input) {
    const produtos = [
        { nome: "vinil taylor swift", pagina: "vinil.html" },
        { nome: "vinil ariana grande", pagina: "vinil.html" },
        { nome: "vinil elton john", pagina: "vinil.html" },
        { nome: "vinil michael jackson", pagina: "vinil.html" },
        { nome: "carta charizard holo", pagina: "cartas.html" },
        { nome: "carta pikachu illustrator", pagina: "cartas.html" },
        { nome: "carta mewtwo gx", pagina: "cartas.html" },
        { nome: "carta rayquaza ex", pagina: "cartas.html" }
    ];

    function buscarProduto() {
        const valor = input.value.toLowerCase().trim();

        if (valor === "") return;

        const encontrado = produtos.find(produto =>
            nomesParecidos(valor, produto.nome)
        );

        if (encontrado) {
            const destino = montarCaminhoPagina(encontrado.pagina);
            window.location.href = destino + "?busca=" + encodeURIComponent(valor);
        } else {
            alert("Produto não encontrado.");
        }
    }

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            buscarProduto();
        }
    });
}

function filtrarCardsPorURL() {
    const params = new URLSearchParams(window.location.search);
    const busca = params.get("busca");

    if (!busca || cards.length === 0) return;

    const valorBusca = busca.toLowerCase().trim();

    cards.forEach(card => {
        const nomeElemento = card.querySelector(".nome-produto");

        if (!nomeElemento) return;

        const nome = nomeElemento.textContent.toLowerCase().trim();

        if (nome.includes(valorBusca)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

filtrarCardsPorURL();