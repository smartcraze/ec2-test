import { Database } from "bun:sqlite";


interface Post {
    id: string;
    title: string;
    content: string;
    created_at: string;
}

const db = new Database("posts.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

Bun.serve({
    port: 3000,
    routes: {
        "/*": () => new Response("Wild card!"),
        "/": () => new Response("Hello, World!"),
        // List posts
        "/api/posts": {
            GET: () => {
                const posts = db.query("SELECT * FROM posts").all();
                return Response.json(posts);
            },

            // Create post
            POST: async req => {
                const post = await req.json() as Omit<Post, "id" | "created_at">;
                const id = crypto.randomUUID();

                db.query(
                    `INSERT INTO posts (id, title, content, created_at)
           VALUES (?, ?, ?, ?)`,
                ).run(id, post.title, post.content, new Date().toISOString());

                return Response.json({ id, ...post }, { status: 201 });
            },
        },

        // Get post by ID
        "/api/posts/:id": req => {
            const post = db
                .query("SELECT * FROM posts WHERE id = ?")
                .get(req.params.id);

            if (!post) {
                return new Response("Not Found", { status: 404 });
            }

            return Response.json(post);
        },
    },

    error(error) {
        console.error(error);
        return new Response("Internal Server Error", { status: 500 });
    },
});

console.log("Server running on http://localhost:3000");
