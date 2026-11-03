import { quests } from "../systems/quests";
import { items } from "../data/items";
import type { CombatView, encounters } from "../game/encounters";
export function Journal({
  hud,
  actions,
  dialog,
}: {
  hud: CombatView;
  actions: ReturnType<typeof encounters>;
  dialog: boolean;
}) {
  return (
    <div>
      <h3>{dialog ? hud.station?.name : "Quest journal"}</h3>
      {dialog && hud.station?.id === "merchant" ? (
        <>
          <p>“For the north road? Take something sturdy.”</p>
          {Object.entries(items)
            .filter(([id]) => !["pelt", "relic"].includes(id))
            .map(([id, item]) => (
              <button key={id} onClick={() => actions.shop("buy", id)}>
                Buy {item.name} · {item.price}g
              </button>
            ))}
          {hud.bag.entries.map((e) => (
            <button key={e.id} onClick={() => actions.shop("sell", e.id)}>
              Sell {items[e.item].name}
            </button>
          ))}
        </>
      ) : (
        <>
          {dialog && (
            <p>“The road is open, traveler. Help us keep it that way.”</p>
          )}
          {quests
            .filter((q) => dialog || hud.journal[q.id])
            .map((q) => {
              const p = hud.journal[q.id];
              return (
                <article key={q.id}>
                  <h4>{q.name}</h4>
                  <p>
                    {q.task} {p && p.count + "/" + q.count}
                  </p>
                  {p?.claimed ? (
                    "Completed"
                  ) : dialog ? (
                    <button
                      disabled={!!p && p.count < q.count}
                      onClick={() => actions.quest(q.id)}
                    >
                      {p ? "Claim reward" : "Accept quest"}
                    </button>
                  ) : null}
                </article>
              );
            })}
        </>
      )}
    </div>
  );
}
