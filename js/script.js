function adicionarCarrinho(nome, preco, imagem) {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    carrinho.push({
        nome: nome,
        preco: preco,
        imagem: imagem
    });

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    alert("Adicionado ao carrinho!");
}

function carregarCarrinho() {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    let lista = document.querySelector(".lista-carrinho");
    let totalElemento = document.querySelector(".total h2");

    if (!lista) return;

    lista.innerHTML = "";
    let total = 0;

    if (carrinho.length === 0) {
        lista.innerHTML = "<p>Carrinho vazio</p>";
        totalElemento.innerText = "";
        return;
    }

    carrinho.forEach((item, index) => {
        lista.innerHTML += `
            <div class="item-carrinho">
                <img src="${item.imagem}">
                
                <div class="info">
                    <h3>${item.nome}</h3>
                    <span>R$ ${item.preco}</span>
                </div>

                <button class="remover" onclick="removerItem(${index})">
                    Remover
                </button>
            </div>
        `;

        total += item.preco;
    });

    totalElemento.innerText = "Total: R$ " + total;
}

function removerItem(index) {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    carrinho.splice(index, 1);

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    carregarCarrinho();
}