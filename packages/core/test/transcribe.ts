type Section = { heading: string; lines: string[] };

const releaseHeading = /^\[(.+)\] - (\S+)( \[YANKED\])?$/;

export function glossaryFrom(source: string) {
  return {
    terms: sections(source, 2).map((section) => {
      const firstBullet = section.lines.findIndex((line) =>
        line.startsWith("- ")
      );
      const prose =
        firstBullet === -1
          ? section.lines
          : section.lines.slice(0, firstBullet);
      const bullets =
        firstBullet === -1 ? [] : items(section.lines.slice(firstBullet));
      const aliases = labelled(bullets, "Aliases").flatMap((value) =>
        value.split(",").map((alias) => alias.trim())
      );
      const examples = labelled(bullets, "Example");
      const status = labelled(bullets, "Status").at(0);
      return {
        name: section.heading,
        definition: prose
          .map((line) => line.trim())
          .filter((line) => line !== "")
          .join(" "),
        ...(aliases.length > 0 ? { aliases } : {}),
        ...(examples.length > 0 ? { examples } : {}),
        ...(status === undefined ? {} : { status }),
      };
    }),
  };
}

export function changelogFrom(source: string) {
  const releases: Array<Record<string, unknown>> = [];
  let unreleased: Record<string, string[]> | undefined;

  for (const section of sections(source, 2)) {
    const buckets = bucketsFrom(section.lines);
    if (section.heading === "[Unreleased]") {
      unreleased = buckets;
      continue;
    }
    const match = releaseHeading.exec(section.heading);
    if (!match) throw new Error(`not a release heading: "${section.heading}"`);
    releases.push({
      version: match[1],
      date: match[2],
      ...(match[3] === undefined ? {} : { yanked: true }),
      ...buckets,
    });
  }

  return { ...(unreleased === undefined ? {} : { unreleased }), releases };
}

function bucketsFrom(lines: string[]): Record<string, string[]> {
  const buckets: Record<string, string[]> = {};
  for (const bucket of sections(lines.join("\n"), 3)) {
    buckets[bucket.heading.toLowerCase()] = items(bucket.lines);
  }
  return buckets;
}

function sections(source: string, depth: number): Section[] {
  const marker = `${"#".repeat(depth)} `;
  const found: Section[] = [];
  for (const line of source.split("\n")) {
    if (line.startsWith(marker)) {
      found.push({ heading: line.slice(marker.length).trim(), lines: [] });
      continue;
    }
    found.at(-1)?.lines.push(line);
  }
  return found;
}

function items(lines: string[]): string[] {
  const found: string[] = [];
  for (const line of lines) {
    if (line.startsWith("- ")) {
      found.push(line.slice(2).trim());
      continue;
    }
    const last = found.at(-1);
    if (last !== undefined && line.trim() !== "")
      found[found.length - 1] = `${last} ${line.trim()}`;
  }
  return found;
}

function labelled(bullets: string[], label: string): string[] {
  const prefix = `**${label}:**`;
  return bullets
    .filter((bullet) => bullet.startsWith(prefix))
    .map((bullet) => bullet.slice(prefix.length).trim());
}
