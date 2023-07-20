import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Modal,
  SafeAreaView,
} from "react-native";
import { AuthStateListener } from "../../client/auth/AuthStateListener";
import { theme } from "../theme";
import {
  EvilIcons,
  MaterialCommunityIcons,
  FontAwesome,
  MaterialIcons,
  Entypo,
} from "@expo/vector-icons";
import SVGLogoComponent from "../components/logo";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "../store/authStore";
import Drawer from "./Drawer";
import { Link, useRouter, usePathname } from "expo-router";
import { hexToRGBA } from "../utils/colorFunctions";

const Navigation = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(
    Dimensions.get("window").width < 1024
  );

  const [navBarWidth, setNavBarWidth] = useState(null);
  const [selectedNavItem, setSelectedNavItem] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const hoverColor = hexToRGBA(theme.colors.primary, 0.2);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const staticNavigationItems = useMemo(
    () => [
      {
        href: "/",
        icon: "home",
        text: "Home",
        iconSource: Entypo,
      },
      {
        href: "/about",
        icon: "info",
        text: "About",
        iconSource: MaterialIcons,
      },
    ],
    []
  );

  const userNavigationItems = useMemo(
    () =>
      user
        ? [
            {
              href: "/feed",
              icon: "newspaper-variant",
              text: "Feed",
              iconSource: MaterialCommunityIcons,
            },
            {
              href: "/trips",
              icon: "routes",
              text: "Trips",
              iconSource: MaterialCommunityIcons,
            },
            {
              href: "/packs",
              icon: "backpack",
              text: "Packs",
              iconSource: MaterialIcons,
            },
            {
              href: "profile",
              icon: "book",
              text: "Profile",
              iconSource: FontAwesome,
            },
            {
              href: "logout",
              icon: "logout",
              text: "Logout",
              iconSource: MaterialIcons,
            },
          ]
        : [
            {
              href: "sign-in",
              icon: "login",
              text: "Login",
              iconSource: MaterialIcons,
            },
            {
              href: "register",
              icon: "person-add",
              text: "Register",
              iconSource: MaterialIcons,
            },
          ],
    [user]
  );

  const navigationItems = [...staticNavigationItems, ...userNavigationItems];

  const navigateTo = useCallback(
    (href) => {
      if (href === "logout") {
        dispatch(signOut());
      } else {
        setIsDrawerOpen(false);
        setSelectedNavItem(href);
        setIsLoading(true); // Start loading

        setTimeout(() => {
          router.push(href);
          setIsLoading(false); // Stop loading after a delay
        }, 0); // Adjust the delay as needed
      }
    },
    [dispatch, router]
  );

  useEffect(() => {
    const handleScreenResize = () => {
      setIsMobileView(Dimensions.get("window").width < 1024);
    };

    Dimensions.addEventListener("change", handleScreenResize);
    return () => {
      // Dimensions.removeEventListener("change", handleScreenResize); TODO get an error: removeEventListener is undefined
    };
  }, []);

  const renderNavigationItem = useCallback(
    (item) => {
      const { icon, iconSource, text, href } = item;
      const IconComponent = iconSource || EvilIcons;
      const pathName = usePathname();

      if ((href === "profile" || href === "logout") && !user) {
        return null; // Do not render the item if the user is not signed in
      }

      const isCurrentPage = pathName === href; // compare the current route with the href
      const isSelected = selectedNavItem === href; // check if the item is selected

      const handleItemPress = () => {
        setSelectedNavItem(href);
        navigateTo(href);
      };

      return (
        <TouchableOpacity
          key={item.href}
          style={[
            styles.menuBarItem,
            isCurrentPage && styles.menuBarItemActive, // apply the active style if this is the current page
            isSelected && styles.menuBarItemSelected, // apply the selected style if this item is selected
          ]}
          onPress={handleItemPress}
          activeOpacity={0.7} // Set the activeOpacity to create a hover effect
        >
          <IconComponent
            name={icon}
            size={isMobileView ? 24 : 18}
            color={
              isCurrentPage || isSelected
                ? theme.colors.primary
                : theme.colors.iconColor
            } // change the color if this is the current page or selected item
            key={item.href + "icon"}
          />
          <Text
            style={[
              styles.menuBarItemText,
              isCurrentPage && styles.menuBarItemTextActive, // apply the active style to the text if this is the current page
              isSelected && styles.menuBarItemTextSelected, // apply the selected style to the text if this item is selected
            ]}
          >
            {text}
          </Text>
        </TouchableOpacity>
      );
    },
    [user, selectedNavItem] // add any other dependencies that this function uses
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={styles.container}
        onLayout={(event) => setNavBarWidth(event.nativeEvent.layout.width)} // calculate the width of the navbar
      >
        {user && <AuthStateListener />}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => navigateTo("/")}
          >
            <View style={styles.logoWrapper}>
              <SVGLogoComponent
                width={isMobileView ? 48 : 64}
                height={isMobileView ? 48 : 64}
                fill="#fff"
              />
            </View>
            <Text style={styles.logoText}>PackRat</Text>
          </TouchableOpacity>

          <View style={styles.drawerContainer}>
            {!isDrawerOpen && isMobileView && (
              <TouchableOpacity
                style={styles.drawerTrigger}
                onPress={toggleDrawer}
              >
                <EvilIcons
                  name={isDrawerOpen ? "close" : "navicon"}
                  size={isMobileView ? 36 : 24}
                  color={theme.colors.iconColor}
                />
              </TouchableOpacity>
            )}
          </View>

          {isMobileView ? (
            <Modal
              visible={isDrawerOpen}
              animationType="slide"
              transparent={true}
            >
              <Drawer
                toggleDrawer={toggleDrawer}
                handleSignOut={() => {}}
                navigationItems={navigationItems}
                navigateTo={navigateTo}
                renderNavigationItem={renderNavigationItem}
              />
            </Modal>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.menuBar}
            >
              {navigationItems.map((item) => renderNavigationItem(item))}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
  },
  container: {
    width: "100%",
    backgroundColor: theme.colors.background,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    width: "100%",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoWrapper: {
    marginHorizontal: 10,
  },
  logoText: {
    color: theme.colors.text,
    fontSize: 38,
    fontWeight: "900",
  },
  menuBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    height: 60,
    width: "100%",
  },
  menuBarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  menuBarItemText: {
    color: theme.colors.text,
    fontSize: 18,
  },
  drawerContainer: {},
  drawerTrigger: {},
  menuBarItemActive: {
    // Apply styles for the active item
    // ...
  },
  menuBarItemTextActive: {
    // Apply styles for the active item's text
    // ...
  },
  menuBarItemSelected: {
    // Apply styles for the selected item
    // ...
  },
  menuBarItemTextSelected: {
    // Apply styles for the selected item's text
    // ...
  },
});

export default Navigation;
