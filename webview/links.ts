// import { Button } from "@fullstacked/ui";

const nav = document.querySelector("nav");

const createButtonLink = (text: string, link: string) => {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    // const button = Button({
    //     text,
    //     iconRight: "External Link"
    // });
    const button = document.createElement("button");
    button.innerText = text;
    a.append(button);
    return a;
};

nav.append(
    createButtonLink("Documentation", "https://docs.fullstacked.org"),
    createButtonLink("Roadmap", "https://fullstacked.notion.site/FullStacked-Roadmap-ebfcb685b77446c7a7898c05b219215e"),
    createButtonLink("GitHub", "https://github.com/fullstackedorg/fullstacked"),
);

export {}