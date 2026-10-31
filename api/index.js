// Vercel entry point. vercel.json rewrites every addon path here; the website
// itself is served as static files from dist/.
import { createHandler } from '../src/server/handler.js';

export default createHandler({ publicUrl: process.env.PUBLIC_URL });
