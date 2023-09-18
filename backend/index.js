require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 4000; // Puerto en el que se ejecutará el servidor
const cors = require('cors')
const axios =require('axios')


// excell
const fileUpload = require('express-fileupload')
const xls = require ('xlsx')
const fs = require ('fs');
const { type } = require('os');
//------


app.use(cors());
//wocomerce get products



// Configuración de la API de WooCommerce
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const WooCommerce = new WooCommerceRestApi({
  url: 'http://electricosaval.com', // Reemplaza con la URL de tu tienda WooCommerce
  consumerKey: process.env.consumer_key, // Reemplaza con tu clave de consumidor
  consumerSecret: process.env.consumer_secret, // Reemplaza con tu secreto de consumidor
  version: 'wc/v3' // Versión de la API de WooCommerce que deseas utilizar
});


//peticion get de wocomerce todos los productos
  app.get('/wocomerce/products', (req, res) => {
    const getAllProducts = async () => {
      try {
        let page = 1;
        let allProducts = [];
  
        while (true) {
          const response = await WooCommerce.get('products', {
            page,
            per_page: 100, // Ajusta esto según tu necesidad, pero 100 es un valor común
          });
  
          const products = response.data;
  
          if (products.length === 0) {
            // No hay más productos, sal del bucle
            break;
          }
  
          allProducts = [...allProducts, ...products];
          page++;
        }
  
        // Filtra los datos como lo hiciste antes
        const simplifiedProducts = allProducts.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          price_regular: product.regular_price,
          sale_price: product.sale_price,
          description: product.description,
          permalink: product.permalink,
          attributes: product.attributes,
          categories:product.categories
        }));
  
        // Envía la respuesta JSON al cliente
        res.json(simplifiedProducts);
      } catch (error) {
        // Maneja los errores aquí
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
      }
    };
  
    getAllProducts();
  });




// Ruta para obtener detalles de un producto específico por su ID
app.get('/wocomerce/products/:productId', (req, res) => {
    const productId = req.params.productId; // Obtén el ID del producto desde la URL
  
    // Realiza una solicitud GET a la API de WooCommerce
    WooCommerce.get(`products/${productId}`)
     .then((response) => {
        // Envía los detalles del producto como respuesta
        res.json(response.data);
      })
      .catch((error) => {
        console.error('Error al obtener detalles del producto:', error);
        res.status(500).json({ error: 'Error al obtener detalles del producto' });
      });
  });

  //Ruta para borrar por ID
app.delete("/wocomerce/products/:productId",(req, res)=> {
  const productId = req.params.productId;

  WooCommerce.delete(`products/${productId}`,{force: true})
  .then((response) => {
    console.log(response.data.id);
    res.status(204).send();
  })
  .catch((error) => {
    console.log(error.response.data);
    res.status(500).json({err: 'error al eliminal el producto'})
  });

});




// Ruta para actualizar stock
// Ruta para actualizar un producto específico por su ID
app.put('/wocomerce/products/:productId', (req, res) => {
    const productId = req.params.productId; // Obtén el ID del producto desde la URL
    const updatedProductData = req.body; // Datos actualizados del producto enviados en el cuerpo de la solicitud
  
    // Utiliza la instancia de WooCommerce para hacer una solicitud PUT a la API de WooCommerce
    WooCommerce.put(`products/${productId}`, updatedProductData)
      .then((response) => {
        // Maneja la respuesta de la API aquí
        res.json(response.data);
      })
      .catch((error) => {
        // Maneja los errores aquí
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
      });
  });


/*

//-----actualizar en masa------//

const json = './jsonActualizar/productos.json'

const bulkUpdateData = JSON.parse(fs.readFileSync(json, 'utf-8'));
async function actualizarProductos() {
  try {
    // Itera a través de los datos de actualización y realiza solicitudes PUT individuales
    for (const updateItem of bulkUpdateData) {
      const productId = updateItem.id; // Obtén el ID del objeto de actualización
      
      try {
        // Verifica si existe un producto con el mismo ID
        const existingProduct = await WooCommerce.get(`products/${productId}`);
        
        if (existingProduct && existingProduct.data && existingProduct.data.id === productId) {
          // Si existe un producto con el mismo ID, actualiza el producto
          console.log("Producto a actualizar:", updateItem.name);
          const response = await WooCommerce.put(`products/${productId}`, updateItem);
          console.log("Producto actualizado con éxito:", response.data.name);
        } else {
          console.log(`El producto con ID ${productId} no existe en WooCommerce. No se puede actualizar.`);
        }
      } catch (error) {
        console.error(`Error al verificar/actualizar el producto con ID ${productId}`, error);
      }
    }
  } catch (error) {
    console.error('Error al leer el archivo JSON o actualizar productos:', error);
  }
}

// Llama a la función para iniciar la actualización
actualizarProductos();
*/

//----- end actualizar en masa------//



/*

// -------------- esto es para añadir nuevos productos ---------

  const jsonFilePath = './NewProducts/NewProducts.json'; // Ruta al archivo JSON con los nuevos productos


  // Lee el archivo JSON de la ruta especificada
  try {
    const productsToAdd = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
  
    // Itera a través de los datos de productos y realiza comprobación de SKU antes de agregar
    productsToAdd.forEach((productData) => {
      const sku = productData.sku;
  
      // Comprueba si un producto con el mismo SKU ya existe en WooCommerce
      WooCommerce.get('products', { sku: sku })
        .then((response) => {
          const existingProduct = response.data[0]; // Suponemos que no hay duplicados exactos
  
          if (!existingProduct) {
            // Si no existe un producto con el mismo SKU, agrega el nuevo producto
            WooCommerce.post('products', productData)
              .then((response) => {
                console.log(`Producto agregado: ${response.data.name}`);
              })
              .catch((error) => {
                console.error(`Error al agregar el producto: ${error.message}`);
              });
          } else {
            console.log(`Producto con SKU ${sku} ya existe, se omite la duplicación.`);
          }
        })
        .catch((error) => {
          console.error(`Error al buscar productos por SKU: ${error.message}`);
        });
    });
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
  }
  // ...
  
*/

/*---------- Inicio Categorias de productos   ---------------*/

app.get('/wocomerce/categorias', (req, res) => {
  // Configura el número de resultados por página y la página actual
  const perPage = 100; // Cambia esto según tus necesidades
  let currentPage = 1;
  let allCategories = [];

  // Función recursiva para obtener todas las categorías
  const fetchCategories = () => {
    WooCommerce.get(`products/categories`, {
      per_page: perPage,
      page: currentPage
    })
      .then((response) => {
        const categories = response.data;
        allCategories = allCategories.concat(categories);

        // Si hay más páginas de resultados, sigue obteniendo categorías
        if (categories.length === perPage) {
          currentPage++;
          fetchCategories();
        } else {
          // Todas las categorías han sido obtenidas
          const simplifiedCategories = allCategories.map((category) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            parent: category.parent
          }));
          res.json(simplifiedCategories);
        }
      })
      .catch((error) => {
        console.error('Error al obtener las categorias:', error);
        res.status(500).json({ error: 'Error al obtener las categorias' });
      });
  };

  // Iniciar la obtención de categorías
  fetchCategories();
});

//funcion post añadir categorias
/*
const rutaArchivoJSON = './NewProducts/NewCategories.json';

async function crearCategoriasNuevas(rutaArchivoJSON) {
  try {
    // Realiza una solicitud GET a la API de WooCommerce para obtener las categorías existentes
    const categoriasExistentesResponse = await WooCommerce.get(`products/categories`);
    const categoriasExistentes = categoriasExistentesResponse.data;

    // Carga y analiza el JSON local
    const data = await fs.promises.readFile(rutaArchivoJSON, 'utf8');
    const categoriasNuevas = JSON.parse(data);

    // Filtra las categorías nuevas que no existen en WooCommerce
    const categoriasParaCrear = categoriasNuevas.filter((categoriaNueva) => {
      return !categoriasExistentes.some((categoriaExistente) => {
        return categoriaNueva.id === categoriaExistente.id;
      });
    });
   console.log(categoriasParaCrear)
    

    // Realiza una solicitud POST para crear cada categoría nueva
    for (const categoria of categoriasParaCrear) {
          const response = await WooCommerce.post(`products/categories`, categoria);

      console.log('Categoría creada:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}
crearCategoriasNuevas(rutaArchivoJSON);

*/

/* funcion para actualizar categorias */
const rutaArchivoJSON = './NewProducts/NewCategories.json';
const bulkUpdateDat = JSON.parse(fs.readFileSync(rutaArchivoJSON, 'utf-8'));

async function actualizarCategorias() {
  try {
    // Itera a través de los datos de actualización y realiza solicitudes PUT individuales
    for (const updateItem of bulkUpdateDat) {
      const categoryId = updateItem.id; // Obtén el ID de la categoría de actualización
      
      try {
        // Verifica si existe una categoría con el mismo ID
        const existingCategory = await WooCommerce.get(`products/categories/${categoryId}`);
        
        if (existingCategory && existingCategory.data && existingCategory.data.id === categoryId) {
          // Si existe una categoría con el mismo ID, actualiza la categoría
          console.log("Categoría a actualizar:", updateItem.name);
          const response = await WooCommerce.put(`products/categories/${categoryId}`, updateItem);
          console.log("Categoría actualizada con éxito:", response.data.name);
        } else {
          console.log(`La categoría con ID ${categoryId} no existe en WooCommerce. No se puede actualizar.`);
        }
      } catch (error) {
        console.error(`Error al verificar/actualizar la categoría con ID ${categoryId}`, error);
      }
    }
  } catch (error) {
    console.error('Error al leer el archivo JSON o actualizar categorías:', error);
  }
}

// Llama a la función para iniciar la actualización de categorías
//actualizarCategorias();




/*---------- Fin Categorias de productos   ---------------*/


/* ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */



/*---------- Inicio atributos   ---------------*/

app.get('/wocomerce/atributos', (req, res) => {
  // Configura el número de resultados por página y la página actual
  const perPage = 100; // Cambia esto según tus necesidades
  let currentPage = 1;
  let allAtributos = [];

  // Función recursiva para obtener todas las categorías
  const fetchAtributos = () => {
    WooCommerce.get(`products/attributes`, {
      per_page: perPage,
      page: currentPage
    })
      .then((response) => {
        const atributos = response.data;
        allAtributos = allAtributos.concat(atributos);

        // Si hay más páginas de resultados, sigue obteniendo categorías
        if (atributos.length === perPage) {
          currentPage++;
          fetchAtributos();
        } else {
          // Todas las categorías han sido obtenidas
          const simplifiedAtributos = allAtributos.map((atributo) => ({
            id: atributo.id,
            name: atributo.name,
            order_bry: atributo.order_bry,
            has_archives: atributo.has_archives
          }));
          res.json(simplifiedAtributos);
        }
      })
      .catch((error) => {
        console.error('Error al obtener los atributos: ', error);
        res.status(500).json({ error: 'Error al obtener los atributos' });
      });
  };

  // Iniciar la obtención de categorías
  fetchAtributos();
});



//-------------------MERCADOLIREB--------------------------------------------------
   
//AUTENTICACION 
const redirect_uri = "https://electricosaval.com/"
app.get ('/mercadolibre',  (req, res)=>{
  res.redirect(`https://auth.mercadolibre.com.co/authorization?response_type=code&client_id=${process.env.Mercadolibre_client_id}&redirect_uri=${redirect_uri}`)

});
// ruta para el acces_token
app.get ('/mercadolibre/auth', async (req, res)=>{
  let code = req.query.code;
  console.log("este es el codigo",code)
  let body = {
    grant_type:"authorization_code",
    client_id : process.env.Mercadolibre_client_id,
    client_secret: process.env.Mercadolibre_client_secret,
    code : process.env.Mercadolibre_code,
    redirect_uri:redirect_uri, 
  };

  let response = await fetch('https://api.mercadolibre.com/oauth/token',{
    method: 'POST',
    headers: {
      "accept": "application/json",
      "content-type": "application/x-www-form-urlencoded"
    },
    body : JSON.stringify(body)
  })
  const data = await response.json();
  res.status(200).json({response: "success", data});


} )




// api de mercadolibre----------------
   app.use(express.json());

   const accessToken = "APP_USR-8470447482001211-091816-0e41988707b4db550fedda8a366d62dc-266179935";
   
   app.get('/mercadolibre/products', (req, res) => {
     const nickname = "ELECTRICOS AVAL";
     const apiUrl = `https://api.mercadolibre.com/sites/MCO/search?nickname=${nickname}`;
   
     const headers = {
       Authorization: `Bearer ${accessToken}`
     };
   
     axios.get(apiUrl, { headers })
       .then(response => {
         res.status(200).json(response.data.results);
       })
       .catch(error => {
         res.status(500).json({ error: 'Error al hacer la solicitud a MercadoLibre' });
       });
   });

//end peticion mercadolibre



//----------- ruta para actualizar los productos en masa --------   ///
// Función para actualizar artículos en MercadoLibre
app.get('/mercadolibre/AllProducts', async (req, res) => {
  try {
    // Lee el archivo JSON
    const jsonData = fs.readFileSync('./ActualizarML/productosML.json', 'utf-8');
    const data = JSON.parse(jsonData);

    // Verifica que data sea un array de objetos con propiedades 'id' y 'price'
    if (Array.isArray(data) && data.length > 0 && data.every(item => item.id && item.price)) {
      // Llama a la función para actualizar los precios de los productos coincidentes
      console.log(data)
      const updatedItems = await actualizarPrecios(data);
     

      res.json({ response: 'success', updatedItems });
    } else {
      res.status(500).json({ response: 'error', message: 'El formato de datos es incorrecto.' });
    }
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
    res.status(500).json({ response: 'error', message: 'Error al leer el archivo JSON.' });
  }
});

// Función para actualizar los precios de los productos coincidentes
async function actualizarPrecios(productosParaActualizar) {
  const ACCESS_TOKEN = 'APP_USR-8470447482001211-091816-0e41988707b4db550fedda8a366d62dc-266179935'; // Reemplaza con tu token de acceso
  const updatedItems = [];

  for (const producto of productosParaActualizar) {
    const apiUrl = `https://api.mercadolibre.com/items/${producto.id}`;
    
    // Configura las opciones comunes de la solicitud PUT
    const requestOptions = {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
         price: producto.price,
         available_quantity: producto.available_quantity
        }), // Solo actualiza el precio
    };

    try {
      const response = await fetch(apiUrl, requestOptions);
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const updatedItem = await response.json();
        updatedItems.push(updatedItem);
      } else {
        console.error('La respuesta no es un JSON válido:', await response.text());
      }
    } catch (error) {
      console.error('Error al actualizar el artículo:', error);
    }
  }

  return updatedItems;
}





// fin de actualizar en masa /// 






/*--------  fin atributos   -------------------*/


// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});