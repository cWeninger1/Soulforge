// @vitest-environment jsdom
import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Menu } from "../src/app/App";
import { connectFirebase } from "../src/services/firebase";
test("entry route offers local play even without cloud configuration", () => {
  render(
    <MemoryRouter>
      <Menu />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link").getAttribute("href")).toBe("/valley");
  expect(connectFirebase({}).message).toContain("apiKey");
});
