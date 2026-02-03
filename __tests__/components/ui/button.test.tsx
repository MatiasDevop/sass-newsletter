import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text and default variant", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("data-variant", "default");
    expect(btn).toHaveAttribute("data-size", "default");
  });

  it("applies selected variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toHaveAttribute("data-variant", "destructive");
  });

  it("respects disabled prop", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button", { name: /disabled/i });
    expect(btn).toBeDisabled();
  });
});
