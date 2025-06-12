const formatObjectData = (data, keys) => {
  const formatItem = (item) => {
    return {
      string: `
            ${keys
              .map((key) => {
                const value = item[key];

                if (Array.isArray(value)) {
                  return `${key}: ${value
                    .map((subItem) => {
                      if (typeof subItem === "object") {
                        return Object.entries(subItem)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ");
                      }
                      return subItem;
                    })
                    .join(" | ")}`;
                } else if (typeof value === "object" && value !== null) {
                  return `${key}: ${Object.entries(value)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}`;
                } else {
                  return `${key}: ${value}`;
                }
              })
              .join("\n")}`,
    };
  };

  return Array.isArray(data) ? data.map(formatItem) : formatItem(data);
};

function formatContextArray(contextArray) {
  if (!contextArray || contextArray.length === 0) return "No results found.";
  return contextArray
    .map((context) => `${formatContext(context)}.`)
    .join("\n\n");
}

function formatContext(context) {
  const keys = Object.keys(context).filter(
    (key) => key !== "_id" && key !== "vectorized"
    // &&
    // key !== "Question-Type" &&
    // key !== "Prompt"
  );
  return formatObjectData(context, keys).string;
}

export { formatObjectData, formatContextArray };
