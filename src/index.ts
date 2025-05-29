import { Elysia, t } from "elysia";
import { Posicion } from '@prisma/client';
import { createPlayer, getPlayers, updatePlayer, deletePlayer } from 'internal/players';

const app = new Elysia()
  .group("/players", (app) => {
    return app
      .get("/", async ({ set }) => {
        try {
          const players = await getPlayers();
          return players;
        } catch (error) {
          console.error("Error fetching players for /players route:", error);
          set.status = 500;
          return { message: "Failed to retrieve players" }
        }
      })
      .post("/", async ({ body, set }) => {
        try {
          const newPlayer = await createPlayer(body as any);
          set.status = 201;
          return newPlayer
        } catch (error: any) {
          console.error("Error creating player:", error);
          if (error.code == 'P2002') {
            set.status = 409;
            return { message: 'Player with this data already exists' }
          }
          set.status = 500;
          return { message: 'failed to create player' };
        }
      },
        {
          body: t.Object({
            nombre: t.String(),
            posicion: t.Enum(Posicion), // Validate against your Prisma Enum
            edad: t.Number(),
            nacionalidad: t.String(),
            equipos: t.Optional(
              t.Array(
                t.Object({
                  equipoId: t.Number(),
                  fechaIngreso: t.Union([t.String({ format: 'date-time' }), t.Date()]), // Accept string or Date
                  fechaSalida: t.Optional(t.Nullable(t.Union([t.String({ format: 'date-time' }), t.Date()]))),
                })
              )
            ),
          }),
        }
      )
      .delete(
        '/:id',
        async ({ params, set }) => {
          try {
            await deletePlayer(Number(params.id));
            set.status = 204;
            return;
          } catch (error: any) {
            console.error(`Error deleting player with ID ${params.id}:`, error);
            if (error.message.includes('Player not found')) {
              set.status = 404;
              return { message: 'Player not found' };
            }
            set.status = 500;
            return { message: 'Failed to delete player' };
          }
        },
        {
          params: t.Object({
            id: t.Numeric(),
          }),
        }
      )
  })
  .listen(3001);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
