import { ArrowBackIcon } from "@chakra-ui/icons";
import {
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Tag,
  TagCloseButton,
  Textarea,
  VStack,
  useToast,
  Text,
  Icon
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { PageName, type Vault } from "../config/types";
import { checkIfVaultDetailedPage } from "../services/utils";
import { api } from "../sidepanel/api";
import { useGlobal } from "../sidepanel/hooks/useGlobal";

import useConfirm from "./hooks/useConfirm";

const exampleTags = [
  "XOT looking sexy and seductive on the beach",
  "XOT stroking on the couch looking seductive",
  "XOT wants to know if [usr] wants to suck it"
];

function VaultComponent({ vault: originalVault }: { vault?: Vault }) {
  const { setActivePage, selectedModel, logger, jwtToken, accountId, currentWebviewId } =
    useGlobal();
  const [currentVault, setCurrentVault] = useState<Vault | null>(originalVault);
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [dbVaults, setVaultItems] = useState<any[]>([]); // Added state to store vault items
  const [tags, setTags] = useState<string[]>(originalVault?.tags || []);
  const [isEditName, setIsEditName] = useState(false); // Add this line
  const toast = useToast();
  const { showConfirmToast } = useConfirm();
  const clear = () => {
    setCurrentVault(null);
    setTags([]);
  };

  const syncVault = async (
    { force }: { force: boolean } = { force: false }
  ) => {
    if (!(await checkIfVaultDetailedPage(currentWebviewId))) {
      toast({
        title: "Please select a Vault Category on the Vault Page",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      return;
    }
    // clear();
    setLoading(true);
    // TODO: need implementation
    // const vaults = await fetchVaultItems();
    const vaults = [];
    let vault = (await api.retrieveCurrentVault()) as Vault;
    if (!vault) {
      setLoading(false);
      return;
    }

    if (force) {
      // if force we want to update only name without changing any data
      vault = { ...originalVault, name: vault.name };
    } else {
      let filterVaultName = currentVault?.name;
      const foundIndex = vaults.findIndex(
        (item) => item.name === filterVaultName
      );
      if (foundIndex !== -1) {
        const dbVault = vaults[foundIndex];
        if (force) {
          delete dbVault.name; // if force we want to use name from html vault
          vault.uuid = originalVault.uuid; // if force we want to use uuid of current vault
        }
        vault = { ...vault, ...dbVault };
        setTags(dbVault.tags || []);
      }
    }
    vault = { ...vault, influencer_uuid: selectedModel.uuid };
    setCurrentVault(vault);
    setLoading(false);
  };

  const fetchVaultItems = async () => {
    try {
      if (!selectedModel.uuid) {
        // toast({ title: "Please, select a model", status: "error" });
        return;
      }
      logger.debug("VaultComponent jwtToken", jwtToken);
      const response = await api.getVaults(jwtToken, accountId);
      if (response.success) {
        return response.data;
      } else {
        toast({
          title: response.error || "Failed to fetch vault items",
          status: "error",
          duration: 1000,
          isClosable: true
        });
      }
    } catch (error) {
      toast({
        title:
          error.message ||
          "An unexpected error occurred while fetching vault items",
        status: "error",
        duration: 1000,
        isClosable: true
      });
      return [];
    }
  };

  useEffect(() => {
    if (!currentVault && selectedModel) {
      syncVault();
    }
  }, [currentVault, selectedModel]);

  const handleTagRemove = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    setLoading(true);
    if (currentVault) {
      const vaultItem = {
        ...currentVault,
        influencer_uuid: selectedModel.uuid,
        accountId,
        tags: JSON.stringify(tags)
      };
      try {
        let response;
        if (currentVault.uuid) {
          response = await api.updateVaultItem(
            jwtToken,
            currentVault.uuid,
            vaultItem
          );
        } else {
          response = await api.saveVaultItem(jwtToken, vaultItem);
        }
        if (response?.success) {
          const updatedVault = response.vault;
          setVaultItems((prevDbVaults) =>
            prevDbVaults.map((item) =>
              item.uuid === updatedVault.uuid
                ? { ...item, ...updatedVault }
                : item
            )
          );
          setActivePage(PageName.VaultList);
          toast({ title: "Vault item saved successfully", status: "success" });
          // go to page
        } else {
          toast({
            title: response.error || "Failed to save vault item",
            status: "error",
            duration: 1000,
            isClosable: true
          });
        }
      } catch (error) {
        toast(error.message || "An unexpected error occurred");
      }
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (currentVault) {
      try {
        const response = await api.deleteVaultItem(jwtToken, currentVault.uuid);
        // Assuming response handling includes checking for a success status
        if (response?.success) {
          clear();
          toast({
            title: "Vault item deleted successfully",
            status: "success",
            duration: 1000,
            isClosable: true
          });
        } else {
          toast({
            title: response?.message || "Failed to delete vault item",
            status: "error",
            duration: 1000,
            isClosable: true
          });
        }
      } catch (error) {
        toast({
          title:
            error.message ||
            "An unexpected error occurred while deleting vault item",
          status: "error",
          duration: 1000,
          isClosable: true
        });
      }
    }
  };

  if (!currentVault) {
    if (loading) {
      return <div>Loading ....</div>;
    }
    return (
      <div>
        Please go to the Vault tab and select the Vault Category you want to add
        / edit{" "}
        <Button size="sm" onClick={() => syncVault()}>
          Sync
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Text fontSize="sm" mt={1} mb={4} color="gray.500">
        Choose a vault category that has only a single media item
      </Text>
      <Card style={{ width: "100%", paddingBottom: "1rem" }}>
        <CardBody
          gap={4}
          display={"flex"}
          flexDirection={"row"}
          flexWrap={"wrap"}
          justifyContent={"space-between"}
        >
          <HStack justifyContent="space-between" width="full">
            <Button
              size="sm"
              onClick={() => {
                setActivePage(PageName.VaultList);
              }}
            >
              <Icon as={ArrowBackIcon} />
              Back
            </Button>
            <Button
              size="sm"
              onClick={() => {
                showConfirmToast({
                  text: `Are you sure you want to update Vault ${currentVault.name}?`,
                  onConfirm: () => {
                    syncVault({ force: true });
                  }
                });
              }}
              colorScheme="yellow"
            >
              Sync
            </Button>
          </HStack>
          <Text fontSize="sm" mt={1} mb={1} color="gray.500">
            Category Title
          </Text>

          {/* <ModelSelect label={"Model"} disabled={true} /> */}
          <FormControl id="vault-item-name">
            <FormLabel>Category Name</FormLabel>
            <HStack>
              <Input
                placeholder="Enter vault item name"
                value={currentVault.name}
                disabled={!isEditName}
              />
              {/*<Button size="sm" onClick={() => setIsEditName(!isEditName)}>*/}
              {/*  {isEditName ? "Save" : "Edit"}*/}
              {/*</Button>*/}
            </HStack>
          </FormControl>
          <FormControl id="vault-item-description" width="100%">
            <FormLabel>Note (not used by AI model)</FormLabel>
            <Textarea
              placeholder="Not used by AI"
              value={currentVault.description}
              onChange={(e) =>
                setCurrentVault({
                  ...currentVault,
                  description: e.target.value
                })
              }
              width="100%"
            />
          </FormControl>
          <FormControl id="suggested-price">
            <FormLabel>Suggested Price</FormLabel>
            <HStack spacing={3}>
              <Text mr={2}>$USD</Text>
              <Input
                placeholder="Enter suggested price"
                value={currentVault.suggested_price}
                onChange={(e) =>
                  setCurrentVault({
                    ...currentVault,
                    suggested_price: parseFloat(e.target.value)
                  })
                }
                type="number"
                min="0"
                step="0.01"
              />
            </HStack>
          </FormControl>
          <FormControl id="tags">
            <FormLabel>Tags</FormLabel>
            <HStack>
              <Input
                id="tag-input"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && tagInput.trim() !== "") {
                    setTags([...tags, tagInput.trim()]);
                    setTagInput(""); // Clear the input after adding a tag
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (tagInput.trim() !== "") {
                    setTags([
                      ...tags,
                      tagInput.trim().replace(/\bxot\b/gi, "XOT")
                    ]);
                    setTagInput(""); // Clear the input after adding a tag
                  }
                }}
              >
                Add
              </Button>
            </HStack>
            <VStack
              fontSize="xx-small"
              mt={1}
              color="gray.500"
              align="flex-start"
              spacing={1}
            >
              <Text>Examples:</Text>
              {exampleTags.map((tag, index) => (
                <Text key={index}>{tag}</Text>
              ))}
            </VStack>
            <Tags tags={tags} handleTagRemove={handleTagRemove} />
          </FormControl>
          <Button
            colorScheme="red"
            onClick={() => {
              showConfirmToast({
                text: `Are you sure you want to delete the Vault`,
                onConfirm: () => {
                  handleDelete();
                }
              });
            }}
            flexBasis={"45%"}
            disabled={loading}
          >
            Delete
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            flexBasis={"45%"}
            disabled={loading}
          >
            Save{" "}
            {loading && (
              <span role="img" aria-label="loading">
                ⏳
              </span>
            )}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export const Tags = ({
  tags,
  handleTagRemove
}: {
  tags: string[];
  handleTagRemove: (tag: string) => void;
}) => {
  return (
    <VStack spacing={2} alignItems="flex-start" mt={5}>
      {tags?.map((tag) => (
        <Tag size="md" key={tag} borderRadius="full" whiteSpace="pre-wrap">
          {tag}
          <TagCloseButton onClick={() => handleTagRemove(tag)} />
        </Tag>
      ))}
    </VStack>
  );
};
export default VaultComponent;
