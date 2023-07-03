import { StyleSheet } from "react-native";
import { Table, TableWrapper, Row, Cell } from "react-native-table-component";

import { Feather } from "@expo/vector-icons";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CustomModal } from "../../components/modal";
import { Select, Button, Checkbox } from "native-base";

import Water from "../Water";

import { useState, useMemo, useEffect } from "react";
import { Box, Text, Input, View } from "native-base";

import { useDispatch, useSelector } from "react-redux";
import { editItem, deleteItem } from "../../store/itemsStore";

import { convertWeight } from "../../utils/convertWeight";
import { openModal, selectPackById } from "../../store/packsStore";
import { AddItem } from "../item/AddItem";
import { EditPackItemModal } from "./EditPackItemModal";
import { ItemCategoryEnum } from "../../constants/itemCategory";

export const TableContainer = ({ currentPack }) => {
  // const { data, isLoading, isError, error } = useGetItems(packId);
  const [currentPackId, setCurrentPackId] = useState(null);
  const [waterItem, setWaterItem] = useState(null);

  const dispatch = useDispatch();

  const data = currentPack?.items;

  const isLoading = useSelector((state) => state.items.isLoading);

  const error = useSelector((state) => state.items.error);
  const isError = error !== null;

  const [edit, setEdit] = useState();

  // PREFERED WEIGHTING UNIT FOR DISPLAY TO CLIENTSIDE
  const [weightUnit, setWeightUnit] = useState("g");
  const [checkedItems, setCheckedItems] = useState([]);
  let totalFoodWeight = 0;
  let totalWaterWeight = 0;
  let totalBaseWeight = 0;

  const handleCheckboxChange = (item) => {
    if (checkedItems.includes(item)) {
      setCheckedItems((prevCheckedItems) =>
        prevCheckedItems.filter((checkedItem) => checkedItem !== item)
      );
    } else {
      setCheckedItems((prevCheckedItems) => [...prevCheckedItems, item]);
    }
  };

  const calculate = (value) => {
    // update the item values and then recalculate
    return currentPack?.items?.reduce((acc, item) => {
      if (item?.weight === NaN) {
        return acc;
      }
      if (
        typeof item?.weight === "number" &&
        typeof item?.quantity === "number"
      ) {
        const convertedWeight = convertWeight(
          item?.weight,
          item?.unit,
          weightUnit
        );
        const result = acc + convertedWeight * item.quantity;
        return result;
      } else {
        return acc;
      }
    }, 0);
  };

  const WeightUnitDropdown = ({ value, onChange }) => {
    return (
      <Select
        selectedValue={value}
        accessibilityLabel="Select weight unit"
        placeholder="Select weight unit"
        onValueChange={(itemValue) => onChange(itemValue)}
      >
        <Select.Item label="Kg Kilogram" value="kg" />
        <Select.Item label="G Gram" value="g" />
        <Select.Item label="Lb Pound" value="lb" />
        <Select.Item label="Oz Ounce" value="oz" />
      </Select>
    );
  };

  const handleWeightChange = (value, index) => {
    const newItem = { ...data[index], weight: value };
    const convertedWeight = convertWeight(value, weightUnit, "lb");
    setData((prevState) => [
      ...prevState.slice(0, index),
      newItem,
      ...prevState.slice(index + 1),
    ]);
  };
  data &&
    data
      .filter((item) => !checkedItems.includes(item.name))
      .forEach((item) => {
        switch (item.category.name) {
          case ItemCategoryEnum.ESSENTIALS: {
            totalBaseWeight += convertWeight(
              item.weight * item.quantity,
              item.unit,
              weightUnit
            );

            break;
          }
          case ItemCategoryEnum.FOOD: {
            totalFoodWeight += convertWeight(
              item.weight * item.quantity,
              item.unit,
              weightUnit
            );

            break;
          }
          case ItemCategoryEnum.WATER: {
            totalWaterWeight += convertWeight(
              item.weight * item.quantity,
              item.unit,
              weightUnit
            );
          }
        }
      });
  let totalWeight = totalBaseWeight + totalWaterWeight + totalFoodWeight;
  const tableData = {
    tableTitle: ["Pack List"],
    tableHead: [
      "Item Name",
      `Weight`,
      "Quantity",
      "Category",
      "Edit",
      "Delete",
      "Ignore",
    ],
    tableBaseData: data?.map((value) => Object.values(value).slice(1)),
    tableWater: ["Water", totalWaterWeight, "", "", ""],
    tableFood: ["Food", totalFoodWeight, "", "", ""],
    tableWaterFood: [
      "Water + Food",
      totalWaterWeight + totalFoodWeight,
      "",
      "",
      "",
    ],
    tableTotal: ["Total", totalWeight, "", "", ""],
  };

  const flexWidthArr = [2, 1, 1, 0.5, 0.5];

  const tableDb = data?.map(
    ({ name, weight, category, quantity, unit, _id }, index) => [
      name,
      `${weight} ${unit}`,
      quantity,
      `${category.name}`,
      <EditPackItemModal packId={_id} initialData={data[index]} />,
      <Feather
        name="x-circle"
        size={20}
        color="black"
        onPress={() => deleteItem.mutate(_id)}
        style={{ alignSelf: "center" }}
      />,
      <Checkbox
        marginLeft="20"
        key={_id}
        isChecked={checkedItems.includes(name)}
        onChange={() => handleCheckboxChange(name)}
      />,
    ]
  );

  const tablekeys = data?.map((value) => Object.keys(value).slice(1));

  useEffect(() => {}, [data]);

  const handleEdit = (id, value, cellIndex) => {
    const newRow = { ...data[id], [tablekeys[id][cellIndex]]: value };
    setData((prevState) => [
      ...prevState.slice(0, id),
      newRow,
      ...prevState.slice(id + 1),
    ]);
  };

  if (isLoading) return <Text>Loading....</Text>;

  return (
    <Box style={styles.container}>
      <WeightUnitDropdown value={weightUnit} onChange={setWeightUnit} />
      {data?.length > 0 ? (
        <Table
          style={styles.tableStyle}
          borderStyle={{ borderColor: "transparent" }}
        >
          <Row data={tableData.tableTitle} style={styles.title} />
          <Row
            data={tableData.tableHead.map((header, index) => (
              <Cell key={index} data={header} />
            ))}
            style={styles.head}
          />
          {tableDb.map((rowData, index) => (
            <TableWrapper key={index} style={styles.row} flexArr={flexWidthArr}>
              {rowData.map((cellData, cellIndex) => (
                <Cell
                  key={cellIndex}
                  onPress={() => console.log("index of ", index)}
                  data={cellData}
                />
              ))}
            </TableWrapper>
          ))}
        </Table>
      ) : (
        <Text>Add your First Item</Text>
      )}
      <Water currentPack={currentPack} setWaterItem={setWaterItem} />

      {data?.length > 0 && (
        <>
          <Box
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingHorizontal: 25,
              marginVertical: 30,
              flex: 1,
            }}
          ></Box>
          <Box
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingHorizontal: 25,
              marginVertical: 30,
              flex: 1,
            }}
          >
            <Text>Base Weight</Text>
            <Text>
              {totalBaseWeight} ({weightUnit})
            </Text>
          </Box>
          <Box
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingHorizontal: 25,
              marginVertical: 30,
              flex: 1,
            }}
          >
            <Text>Water + Food Weight </Text>
            <Text>
              {totalWaterWeight + totalFoodWeight} ({weightUnit})
            </Text>
          </Box>
          <Box
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              paddingHorizontal: 25,
              marginVertical: 30,
              flex: 1,
            }}
          >
            <Text>Total Weight</Text>
            <Text>{`${totalWeight} (${weightUnit})`}</Text>
          </Box>
        </>
      )}
      {isError ? <Text>{error}</Text> : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  container: {
    textAlign: "center",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tableStyle: {
    width: "95%",
    gap: 15,
    textAlign: "center",
    alignItems: "center",
  },
  title: {
    height: 40,
    backgroundColor: "#f1f8ff",
    borderRadius: 5,
    width: "100%",
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    fontSize: 20,
  },
  head: {
    height: 40,
    borderBottomWidth: 2,
    borderBottomColor: "grey",
    width: "100%",
    marginBottom: 15,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  editDeleteHead: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    width: "100%",
    height: 25,
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "center",
    gap: 10,
  },

  dataCell: {
    // flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  smallCell: {
    // width: 50,
    // flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },

  specialRow: {
    flexDirection: "row",
    width: "100%",
    height: 25,
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "left",

    gap: 10,
  },

  foodContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    paddingLeft: 15,
    backgroundColor: "#78B7BB",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    alignSelf: "center",
  },

  btn: { width: 58, height: 18, backgroundColor: "#78B7BB", borderRadius: 2 },
  btnText: { textAlign: "center", color: "#fff" },
});
