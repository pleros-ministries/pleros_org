"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";

import type { HomeNavGroup } from "@/lib/site-homepage-content";

type HomepageNavDropdownProps = {
  group: HomeNavGroup;
};

export function HomepageNavDropdown({ group }: HomepageNavDropdownProps) {
  return (
    <Menu.Root>
      <Menu.Trigger className="site-desktop-nav-link site-desktop-nav-trigger inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-2 text-[0.8125rem] text-white/88 transition-colors duration-150 hover:bg-white/12 hover:text-white data-popup-open:bg-white/12 data-popup-open:text-white xl:px-3">
        {group.label}
        <ChevronDownIcon className="size-3.5 opacity-80" aria-hidden="true" />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={10} align="end">
          <Menu.Popup className="site-desktop-nav-menu z-50 w-[15rem] origin-top grid gap-0.5 rounded-[var(--radius-md)] bg-white text-[var(--color-brand-blue)] outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {group.links.map((link) => (
              <Menu.LinkItem
                key={link.href}
                href={link.href}
                closeOnClick
                render={
                  <Link href={link.href} className="site-desktop-nav-menu-link" />
                }
              >
                {link.desktopLabel ?? link.label}
              </Menu.LinkItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
