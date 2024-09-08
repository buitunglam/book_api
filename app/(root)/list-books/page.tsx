"use client";

import { get } from "aws-amplify/api";
import { fetchAuthSession } from "aws-amplify/auth";
import React, { useEffect } from "react";

const page = () => {
  async function getItem() {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken;
    console.log("token -----", token);
    try {
      const restOperation = get({
        apiName: "bookRestApi",
        path: "books",
        options: {
          headers: {
            // @ts-ignore: Unreachable code error
            Authorization: token,
          },
        },
      });
      const response = await restOperation.response;
      console.log("GET call succeeded: ", response);
    } catch (error: any) {
      console.log("GET call failed: ", error);
    }
  }

  useEffect(() => {
    getItem();
  }, []);

  return <div>This is list books</div>;
};

export default page;
