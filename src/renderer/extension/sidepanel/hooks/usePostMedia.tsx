import { useToast } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { sentry } from "../../sentryHelper";

import { api } from "../api";

const usePostMedia = (jwtToken, user_id, account, setMediaDescriptions) => {
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [mediaPosts, setMediaPosts] = useState({});

  const toast = useToast();

  const {
    data: fetchedPostMedia,
    error: fetchPostError,
    refetch: refetchedPostMedia
  } = useQuery({
    queryKey: ["user-post", user_id],
    queryFn: () => api.getPostMedia(jwtToken, user_id, account.uuid),
    enabled: !!user_id && !!account?.uuid
  });

  useEffect(() => {
    if (fetchedPostMedia) {
      setIsLoadingMedia(true);
      if (fetchedPostMedia.success) {
        const mediaDict = fetchedPostMedia.data.reduce((acc, item) => {
          acc[item.external_id] = item;
          return acc;
        }, {});
        setMediaPosts(mediaDict);
        setMediaDescriptions(mediaDict);
      } else {
        toast({
          title: "Error",
          description: fetchedPostMedia.error,
          status: "error",
          duration: 1000,
          isClosable: true
        });
        sentry.captureException(fetchedPostMedia.error);
        setMediaPosts([]);
      }
    }
  }, [fetchedPostMedia]);

  useEffect(() => {
    setIsLoadingMedia(false);
  }, [mediaPosts]);

  useEffect(() => {
    if (fetchPostError) {
      toast({
        title: "Error",
        description: "User fetch error",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      sentry.captureException(fetchPostError);
    }
  }, [fetchPostError]);

  return { isLoadingMedia, mediaPosts, setMediaPosts, refetchedPostMedia };
};

export default usePostMedia;
