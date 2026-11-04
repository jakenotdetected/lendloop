import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ALL_PHOTOS } from "@/lib/photos";

export const metadata: Metadata = { title: "Photo credits · LendLoop" };

export default function Credits() {
  return (
    <>
      <Header showDashboardLink />
      <main className="page">
        <section className="stack">
          <h1 className="page-title">Photo credits</h1>
          <p className="muted">
            Category and example listing photos come from Wikimedia Commons and are used under the licences shown.
            Category photos illustrate the kind of tool, not the exact item a neighbour is lending.
          </p>
        </section>
        <ul className="credits">
          {ALL_PHOTOS.map((photo) => (
            <li key={photo.src}>
              <div className="tool-photo">
                <Image src={photo.src} alt={photo.alt} fill sizes="120px" />
              </div>
              <div>
                <a href={photo.source} target="_blank" rel="noopener noreferrer">
                  {photo.title}
                </a>
                <p className="small muted">
                  {photo.author},{" "}
                  <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">
                    {photo.license}
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
