const express = require('express');
const app = express();
const port = 4000; // Puerto en el que se ejecutará el servidor
const cors = require('cors')
const axios =require('axios')


// excell
const fileUpload = require('express-fileupload')
const xls = require ('xlsx')
const fs = require ('fs')
//------


app.use(cors());
//wocomerce get products



// Configuración de la API de WooCommerce
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;


const WooCommerce = new WooCommerceRestApi({
    url: 'http://electricosaval.com', // Reemplaza con la URL de tu tienda WooCommerce
    consumerKey: 'ck_32352779c93f2030b095f6a22f82666d717762ad', // Reemplaza con tu clave de consumidor
    consumerSecret: 'cs_0674d31cdc67f146492fd836ab5f8c30cbe42fb6', // Reemplaza con tu secreto de consumidor
    version: 'wc/v3' // Versión de la API de WooCommerce que deseas utilizar
  });

  app.get('/', (req, res) => {
    // Utiliza la instancia de WooCommerce para hacer solicitudes a la API de WooCommerce
    WooCommerce.get('products')
      .then((response) => {
        // Maneja la respuesta de la API aquí
        const products = response.data; // Extrae los productos de la respuesta
  
        // Filtra los datos para obtener solo el nombre y el SKU de cada producto
        const simplifiedProducts = products.map(product => ({
          name: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          price_regular: product.regular_price,
          sale_price: product.sale_price,
          description: product.description
        }));
  
        // Envía la respuesta JSON al cliente
        res.json(products);
        
      })
      .catch((error) => {
        // Maneja los errores aquí
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
      });
  });



// Ruta para obtener detalles de un producto específico por su ID
app.get('/products/:productId', (req, res) => {
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
  

// Ruta para actualizar stock
// Ruta para actualizar un producto específico por su ID
app.put('/products/:productId', (req, res) => {
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


const json = './jsonActualizar/productos.json'
//-----actualizar en masa
try {
    // Lee el archivo JSON de la ruta especificada
    const bulkUpdateData = JSON.parse(fs.readFileSync(json, 'utf-8'));
  
    // Itera a través de los datos de actualización y realiza solicitudes PUT individuales
    bulkUpdateData.forEach((updateItem) => {
      const productId = updateItem.id;
      const updateData = updateItem;
  
      WooCommerce.put(`products/${productId}`, updateData)
        .then((response) => {
          console.log(`Producto actualizado: ${response.data.name}`);
        })
        .catch((error) => {
          console.error(`Error al actualizar el producto ${productId}: ${error.message}`);
        });
    });
  } catch (error) {
    console.error('Error al leer el archivo JSON:', error);
  }






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
  






// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor web escuchando en el puerto ${port}`);
});
