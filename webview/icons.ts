document.querySelectorAll(".icon").forEach(async (icon) => {
    const iconName = Array.from(icon.classList)
        .filter((iconClass) => iconClass !== "icon")
        .at(0);
    icon.innerHTML = await (
        await fetch(`assets/images/${iconName}.svg`)
    ).text();
});

export {}