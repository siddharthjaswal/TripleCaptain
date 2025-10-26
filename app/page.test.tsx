import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home page", () => {
  it("renders project hero", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /triple captain/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/fantasy premier league companion/i),
    ).toBeInTheDocument();
  });
});
