import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

const logo = require('../../assets/logo.png');
const { width } = Dimensions.get('window');

export default function Intro({ onFinish }) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(16)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo entra
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      ]),
      // 2. Tagline aparece
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      // 3. Badge Beta aparece
      Animated.delay(200),
      Animated.timing(badgeOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // 4. Pausa
      Animated.delay(900),
      // 5. Fade out completo
      Animated.timing(screenOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[s.fondo, { opacity: screenOpacity }]}>
      {/* Lineas decorativas de fondo */}
      <View style={s.decorTop} />
      <View style={s.decorBottom} />

      <View style={s.centro}>
        {/* Logo */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Image source={logo} style={s.logo} resizeMode="contain" />
        </Animated.View>

        {/* Nombre */}
        <Animated.View style={{ opacity: logoOpacity }}>
          <Text style={s.marca}>Campo Trecho</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
          <Text style={s.lema}>Del productor a tu puerta</Text>
          <View style={s.linea} />
          <Text style={s.sublema}>Sin intermediarios</Text>
        </Animated.View>
      </View>

      {/* Badge zona */}
      <Animated.View style={[s.badgeWrap, { opacity: badgeOpacity }]}>
        <Text style={s.badge}>🌿 Canelones · Montevideo</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: colors.verde,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 48,
  },
  decorTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 12,
  },
  marca: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.blanco,
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  lema: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  linea: {
    width: 40,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center',
    marginVertical: 10,
  },
  sublema: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  badgeWrap: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  badge: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
