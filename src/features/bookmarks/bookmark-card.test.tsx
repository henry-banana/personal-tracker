import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { ConfirmProvider } from "../../components/confirm-dialog";
import { TooltipProvider } from "../../components/ui/tooltip";
import { BookmarkCard } from "./bookmark-card";

describe("Resources card", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      "pt.bookmarks",
      JSON.stringify([
        {
          id: "resource-1",
          title: "LeetCode",
          url: "https://leetcode.com/",
          group: "Backend",
          createdAt: 1,
        },
      ]),
    );
    window.localStorage.setItem("pt.bookmark-groups", JSON.stringify(["Backend"]));
  });

  test("does not make third-party favicon image requests", () => {
    const { container } = render(
      <TooltipProvider>
        <ConfirmProvider>
          <BookmarkCard />
        </ConfirmProvider>
      </TooltipProvider>,
    );

    expect(screen.getByRole("link", { name: /LeetCode/ })).toHaveAttribute(
      "href",
      "https://leetcode.com/",
    );
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });
});
