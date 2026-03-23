/**
 * Application Configuration
 * 
 * Add file paths (relative to public/ or absolute URLs) for models 
 * that should be loaded automatically on application startup.
 */
export const APP_CONFIG = {
    initialModels: {
        adults: [
           "/models/Joanna.glb",
           "/models/Natasha.glb",
           "/models/Riley.glb"
        ] as string[],
        kids: [
           "/models/Amelia.glb",
           "/models/Ellason.glb",
           "/models/Evergreer.glb",
           "/models/Jazzlynn.glb",
           "/models/Mila.glb"
        ] as string[]
    }
};
