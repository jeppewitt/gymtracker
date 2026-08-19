// Øvelsesvarianter.
//
// Nogle øvelser byttes ud fra gang til gang — fx romanian deadlift vs.
// konventionelt dødløft om onsdagen. Vægtene er vidt forskellige, så hver
// variant er sin egen øvelse i databasen (med sin egen historik og sit eget
// vægtforslag) og peger på hovedøvelsen via alternative_for.

// Grupperer en dags øvelsesliste: én gruppe per hovedøvelse, med hovedøvelsen
// først i variants. Rækkefølgen følger rutinens order_index.
export function groupVariants(exercises) {
  const primaries = exercises.filter((e) => e.alternative_for == null);
  return primaries
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((primary) => ({
      primary,
      variants: [
        primary,
        ...exercises.filter((e) => e.alternative_for === primary.id),
      ],
    }));
}

// Hvilken variant er valgt for hver gruppe? selection er { [primaryId]: exerciseId };
// mangler eller peger den på en variant der ikke findes, falder vi tilbage til
// hovedøvelsen.
export function resolveSelected(groups, selection = {}) {
  return groups.map(({ primary, variants }) => {
    const chosenId = selection[primary.id];
    const chosen = variants.find((v) => v.id === chosenId);
    return { primary, variants, selected: chosen ?? primary };
  });
}
