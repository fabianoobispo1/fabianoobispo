"use client";

import Link from "next/link";
import { demos, type Item } from "../lib/demos";
/* import useSession from "@/lib/useSession";
import useStore from "@/store";
import { apiLogoutUser } from "@/lib/api-requests"; */
import clsx from "clsx";
import { GearSix, List, User, X } from "phosphor-react";
import { useState } from "react";

import { useSelectedLayoutSegment } from "next/navigation";

const HeaderV2 = () => {
  /*   const store = useStore();
  const user = useSession(); */
  //const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  /*   const handleLogout = async () => {
    store.setRequestLoading(true);
    try {
      await apiLogoutUser();
    } catch (error) {
    } finally {
      store.reset();
      router.push("/login");
    }
  };
 */
  //if(store.authUser){
  let test = true;
  if (test) {
    return (
      <div className="fixed top-0 z-10 flex w-full flex-col border-b border-gray-800 bg-black lg:bottom-0 lg:z-auto lg:w-1/6 lg:border-b-0 lg:border-r lg:border-gray-800">
        <div className="flex h-14 items-center p-4 lg:h-auto">
          <Link
            href="/dashboard"
            className="group flex items-center gap-x-2.5 lg:w-4/5"
          >
            <div className="flex size-7 items-center rounded-full  border border-white/30 group-hover:border-white/50">
              <User size={26} className="text-cyan-900" />
            </div>

            <h3 className="font-semibold tracking-wide text-gray-400 group-hover:text-gray-50">
              {/* {user?.name} */}
              Fabiano Bispo
            </h3>
          </Link>
          <Link href="/profile" className=" p-2">
            <GearSix size={18} className="text-cyan-900 hover:text-cyan-700 " />
          </Link>
        </div>

        <button
          type="button"
          className="group absolute right-0 top-0 flex h-14 items-center gap-x-2 px-4 lg:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="font-medium text-gray-100 group-hover:text-gray-400">
            Menu
          </div>
          {isOpen ? (
            <X size={24} className="block w-6 text-gray-400" />
          ) : (
            <List size={24} className="block w-6 text-gray-400" />
          )}
        </button>
        <div
          className={clsx("overflow-y-auto lg:static lg:block", {
            "fixed inset-x-0 bottom-0 top-14 mt-px bg-black": isOpen,
            hidden: !isOpen,
          })}
        >
          <div className="flex items-center justify-center">
            {/* <LoginLogoutButton /> */}
          </div>

          <nav className="space-y-6 px-2 py-5">
            {demos.map((section) => {
              return (
                <div key={section.key}>
                  <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400/80">
                    <div>{section.name}</div>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <GlobalNavItem
                        key={item.slug}
                        item={item}
                        close={close}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="flex items-center justify-center">
            <button className="cursor-pointer " /* onClick={handleLogout} */>
              Sair
            </button>
          </div>

          {/*     <Byline className="absolute hidden sm:block" /> */}
        </div>
      </div>
    );
  } else {
    return <></>;
  }
};

function GlobalNavItem({
  item,
  close,
}: {
  item: Item;
  close: () => false | void;
}) {
  const segment = useSelectedLayoutSegment();
  const isActive = item.slug === segment;

  return (
    <Link
      onClick={close}
      href={`/${item.slug}`}
      className={clsx(
        "block rounded-md px-3 py-2 text-sm font-medium hover:text-gray-900",
        {
          "text-gray-400 hover:bg-gray-800": !isActive,
          "text-white": isActive,
        },
      )}
    >
      {item.name}
    </Link>
  );
}

export default HeaderV2;
