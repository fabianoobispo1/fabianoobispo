"use client";
import { useState } from "react";

export default function Megasena() {
  const [apiData, setApiData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/getData");
      const data = await response.json();
      setApiData(data);
      console.log(apiData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  return (
    <div>
      <h1>Next.js API Communication</h1>
      <button
        className=" rounded-lg bg-green-600 px-6 py-2"
        onClick={fetchData}
      >
        Fetch Data from API
      </button>
    </div>
    /*    <ul className="my-auto">
      {countries?.map((country) => <li key={country.id}>{country.name}</li>)}
    </ul> */
  );
}
