export interface PlantResponse {
    name: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    water: string[];
    light: "low" | "medium" | "high";
    temperature: number;
    humidity: number;
    image: string;
}