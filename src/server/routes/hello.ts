import { type BunRequest } from "bun";

const helloRouter = {
  "/api/hello": {
    async GET(req: BunRequest) {
      return Response.json({
        message: "Hello, world!sadasdasasd",
        method: "GET",
      });
    },
    async PUT(req: BunRequest) {
      return Response.json({
        message: "Hello, world!",
        method: "PUT",
      });
    },
  },
  "/api/hello/:name": async (req: BunRequest) => {
    const name = req.params.name;
    return Response.json({
      message: `Hello, ${name}!`,
    });
  },
};


export default helloRouter;