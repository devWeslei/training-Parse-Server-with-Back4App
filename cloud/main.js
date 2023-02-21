const Product = Parse.Object.extend("Product");
const Brand = Parse.Object.extend("Brand");

Parse.Cloud.define("hello", (request) => {
  const name = request.params.name;
	return("Hello world from " + name + " from Cloud Code");
});

Parse.Cloud.define("create-product", async (request) => {
    if(request.user == null) throw "Usuario não autenticado";

    const stock =  request.params.stock;
    if(stock == null || stock > 999) throw "Quantidade inválida";
    if(request.params.brandId == null) throw "Marca invalida";

    const brand = new Brand();
    brand.id = request.params.brandId;

    const product = new Product();
    product.set("name", request.params.name);
    product.set("price", request.params.price);
    product.set("stock", request.params.stock);
    product.set("brand", brand);
    product.set("createdBy", request.user);
    product.set("isSelling", false);
    const savedProduct = await product.save(null, {useMasterKey: true});
    return savedProduct.id;
});

Parse.Cloud.define("change-price", async (request) => {
    if(request.params.productId == null) throw "Produto inválido";
    if(request.params.price == null) throw "Preço não informado";

       const product = new Product();
       product.id = request.params.productId;
       product.set("price", request.params.price);
       const savedProduct = await product.save(null, {useMasterKey: true});
       return savedProduct.get("price");
});

Parse.Cloud.define("delete-product", async (request) => {
    if(request.params.productId == null) throw "Produto inválido";

       const product = new Product();
       product.id = request.params.productId;

       await product.destroy({useMasterKey: true});

       return "Produto excluído com sucesso";
});

Parse.Cloud.define("get-product", async (request) => {
    if(request.params.productId == null) throw "Produto inválido";

    const query = new Parse.Query(Product);
    query.include("brand");
    const product = await query.get(request.params.productId, {useMasterKey: true});
    const json = product.toJSON();
    return {
        name: json.name,
        price: json.price,
        stock: json.stock,
        brandName: json.brand != null ? json.brand.name : null,
    };
});

Parse.Cloud.define("list-products", async (request) => {
    const page = request.params.page;

    const query = new Parse.Query(Product);
//    query.equalTo("isSelling", true);
//    query.greaterThanOrEqualTo("price", 1000);
//    query.lessThanOrEqualTo("price", 3000);
    query.equalTo("createdBy", request.user);
    query.ascending("stock");
    query.limit(2);
    query.skip(page * 2);
    const products = await query.find({useMasterKey: true});
    return products.map(function(p) {
        p = p.toJSON();
        return {
            name: p.name,
            price: p.price,
            stock: p.stock
        }
    });
})

Parse.Cloud.define("sign-up", async (req) => {
    if(req.params.email == null) throw "Email invalido";
    if(req.params.password == null) throw "Senha invalido";
    if(req.params.name == null) throw "Nome invalido";


    const user = new Parse.User();
    user.set("username", req.params.email);
    user.set("email", req.params.email);
    user.set("password", req.params.password);
    user.set("name", req.params.name);
    user.set("city", req.params.city);

    const savedUser = await user.signUp(null, {useMasterKey: true});
    return savedUser.get("sessionToken");
});

Parse.Cloud.define("get-current-user", async (req) => {
    return req.user;
});

Parse.Cloud.define("login", async (req) => {
    const user = await Parse.User.logIn(req.params.email, req.params.password);
    return user;
});

