// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("selection-only workflow", () => {
  test("selecting A and B updates reactant cards", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Reactant A/i }));
    await user.click(screen.getByRole("button", { name: "Zn" }));
    await user.click(screen.getByRole("button", { name: /Select as Reactant A/i }));
    expect(screen.getByTestId("reactant-a-value").textContent).toBe("Zn");

    await user.click(screen.getByRole("button", { name: /Reactant B/i }));
    await user.click(screen.getByRole("button", { name: "Common Compounds" }));
    await user.click(screen.getByRole("button", { name: "CuSO4" }));
    expect(screen.getByTestId("reactant-b-value").textContent).toBe("CuSO4");
  });

  test("changing input clears previous result", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Reactant A/i }));
    await user.click(screen.getByRole("button", { name: "Zn" }));
    await user.click(screen.getByRole("button", { name: /Select as Reactant A/i }));

    await user.click(screen.getByRole("button", { name: /Reactant B/i }));
    await user.click(screen.getByRole("button", { name: "Common Compounds" }));
    await user.click(screen.getByRole("button", { name: "CuSO4" }));

    await user.click(screen.getByRole("button", { name: "Predict" }));
    expect(screen.getByText("Results")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Water" }));
    expect(screen.queryByText("Results")).toBeNull();
  });

  test("reactant count controls update equation preview", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Reactant A/i }));
    await user.click(screen.getByRole("button", { name: "Na" }));
    await user.click(screen.getByRole("button", { name: /Select as Reactant A/i }));

    await user.click(screen.getByRole("button", { name: /Reactant B/i }));
    await user.click(screen.getByRole("button", { name: "Cl" }));
    await user.click(screen.getByRole("button", { name: /Select as Reactant B/i }));

    expect(screen.getByText("Na + Cl -> ?")).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "Increase count" })[1]);
    expect(screen.getByText("Na + 2Cl -> ?")).toBeTruthy();
  });
});
