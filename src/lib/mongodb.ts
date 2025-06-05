// Importamos el cliente de MongoDB desde el paquete oficial
import { MongoClient } from "mongodb";

// Verificamos si la URI de conexión a MongoDB está definida en las variables de entorno
if (!process.env.MONGODB_URI) {
  throw new Error("Por favor define la variable MONGODB_URI en el archivo .env.local");
}

// Guardamos la URI en una constante para usarla más adelante
const uri = process.env.MONGODB_URI;

// Declaramos las variables para el cliente y la promesa de conexión
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Si estamos en modo desarrollo (por ejemplo, con Next.js en `npm run dev`)
if (process.env.NODE_ENV === "development") {
  // Extendemos el objeto global para guardar la promesa del cliente de Mongo
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  // Si aún no existe una conexión guardada, la creamos y la guardamos en global
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri); // Creamos el cliente
    globalWithMongo._mongoClientPromise = client.connect(); // Lo conectamos y guardamos la promesa
  }

  // Usamos la conexión guardada en global
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En producción simplemente conectamos directamente (sin usar global)
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Exportamos la promesa para que se pueda usar en cualquier parte del proyecto
export default clientPromise;
