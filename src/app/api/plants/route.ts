import { NextResponse } from "next/server";
import { PlantResponse } from "@/interfaces/plant";
import { callOpenAI,validateRequest,cleanOpenAIResponse, savePlantToDB } from "@/lib/plantsHooks"; 
import clientPromise from "@/lib/mongodb";
import {ObjectId} from "mongodb"



interface Plant{
    image: string;
}


export async function POST(request:Request){

    const validationError = await validateRequest();
    
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if(!process.env.OPENAI_API_KEY){
        return NextResponse.json({ error: "OpenAI API key is not set" }, { status: 500 });
    }

    if(!process.env.MongoDB_URI){
        return NextResponse.json({ error: "MongoDB URI is not set" }, { status: 500 });
    }

    const body:Plant = await request.json();
    const { image } = body;

    if (!image) {
        return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const response = await callOpenAI(image);

    if(!response){
        throw new Error("No response from OpenAI");
    }

    let plant:PlantResponse;
    
    try {
        const cleanedResponse = cleanOpenAIResponse(response);
        plant = JSON.parse(cleanedResponse);   
    } catch (error) {
        console.error("Error parsing OpenAI response:", error);
        throw error;
    }

    const result = await savePlantToDB(plant,image)

    return result;

};

const client = await clientPromise;

export async function GET(request:Request){
    
    try{
        const {searchParams} = new URL(request.url);
        const id = searchParams.get("id");

        const db = client.db();

        const plantsCollection = db.collection("plants");

        if (!id) {

            const plants = await plantsCollection.find().toArray();
            return NextResponse.json(plants);

        }else{

            const plant = await plantsCollection.findOne({ _id: new ObjectId(id) });

            if (!plant) {
                return NextResponse.json({ error: "Plant not found" }, { status: 404 });
            }

            return NextResponse.json(plant);
        }

    }catch(error){
        console.error("Error feching plants:", error);
        return NextResponse.json({ error: "Error fetching plants" }, { status: 500 });
    }
}

export async function DELETE(request:Request){

    try{
        const {searchParams} = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const db = client.db();
        const plantsCollection = db.collection("plants");

        const result = await plantsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Plant not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Plant deleted successfully" });

    }catch(error){
        console.error("Error deleting plant:", error);
        return NextResponse.json({ error: "Error deleting plant" }, { status: 500 });
    }
}