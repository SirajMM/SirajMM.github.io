// Remit demo: a small money-transfer app that runs live inside the portfolio hero.
// Sample data only. The host page re-skins it by posting {skin: 'plum'} messages.
import 'dart:js_interop';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

void main() => runApp(const RemitApp());

/// Design tokens. Swapping the whole set re-skins every widget.
@immutable
class Skin {
  const Skin(this.brand, this.soft, this.bg, this.ink, this.line, this.mute);
  final Color brand, soft, bg, ink, line, mute;

  static const petrol = Skin(Color(0xFF1F5C57), Color(0xFFE9F0EC), Color(0xFFF5F2EA), Color(0xFF12282A), Color(0xFFE3DED2), Color(0xFF5D6E6D));
  static const plum = Skin(Color(0xFF5B3A6E), Color(0xFFEFE6F2), Color(0xFFF7F2F6), Color(0xFF27182F), Color(0xFFE6DBE5), Color(0xFF6D5E71));
  static const ember = Skin(Color(0xFFA8442A), Color(0xFFF8E6DD), Color(0xFFFBF4EE), Color(0xFF2A1912), Color(0xFFEEDDD1), Color(0xFF79615A));
  static const byName = {'petrol': petrol, 'plum': plum, 'ember': ember};

  static Skin lerp(Skin a, Skin b, double t) => Skin(
        Color.lerp(a.brand, b.brand, t)!, Color.lerp(a.soft, b.soft, t)!, Color.lerp(a.bg, b.bg, t)!,
        Color.lerp(a.ink, b.ink, t)!, Color.lerp(a.line, b.line, t)!, Color.lerp(a.mute, b.mute, t)!,
      );
}

class SkinTween extends Tween<Skin> {
  SkinTween({super.begin, super.end});
  @override
  Skin lerp(double t) => Skin.lerp(begin!, end!, t);
}

class Tokens extends InheritedWidget {
  const Tokens({super.key, required this.skin, required super.child});
  final Skin skin;
  static Skin of(BuildContext c) => c.dependOnInheritedWidgetOfExactType<Tokens>()!.skin;
  @override
  bool updateShouldNotify(Tokens old) => old.skin != skin;
}

String money(double v) {
  final parts = v.toStringAsFixed(2).split('.');
  final s = parts[0];
  final b = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) b.write(',');
    b.write(s[i]);
  }
  return '$b.${parts[1]}';
}

TextStyle ts(double size, Color color, {double w = 400, double wd = 100, double? h}) => TextStyle(
      fontFamily: 'Archivo', fontSize: size, color: color, height: h,
      fontVariations: [FontVariation('wght', w), FontVariation('wdth', wd)],
    );

class RemitApp extends StatefulWidget {
  const RemitApp({super.key});
  @override
  State<RemitApp> createState() => _RemitAppState();
}

class _RemitAppState extends State<RemitApp> {
  Skin skin = Skin.byName[Uri.base.queryParameters['skin']] ?? Skin.petrol;

  @override
  void initState() {
    super.initState();
    web.window.addEventListener('message', ((web.Event e) {
      final data = (e as web.MessageEvent).data;
      if (data.isA<JSString>()) {
        final next = Skin.byName[(data as JSString).toDart.replaceFirst('skin:', '')];
        if (next != null && mounted) setState(() => skin = next);
      }
    }).toJS);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (web.window.parent != null) web.window.parent!.postMessage('remit-ready'.toJS, '*'.toJS);
    });
  }

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<Skin>(
      tween: SkinTween(begin: skin, end: skin),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutCubic,
      builder: (context, s, _) => Tokens(
        skin: s,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          title: 'Remit demo',
          theme: ThemeData(fontFamily: 'Archivo', useMaterial3: true, colorSchemeSeed: s.brand, splashFactory: InkSparkle.splashFactory),
          home: const Shell(),
        ),
      ),
    );
  }
}

class Payee {
  const Payee(this.initials, this.name, this.account);
  final String initials, name, account;
}

const payees = [
  Payee('AK', 'Anil Kumar', 'Bank account ending 4821'),
  Payee('FR', 'Fathima R.', 'Bank account ending 1077'),
  Payee('JM', 'Joseph M.', 'Cash pickup, Kochi'),
  Payee('PS', 'Priya S.', 'Bank account ending 6390'),
];

class Transfer {
  const Transfer(this.payee, this.amount);
  final Payee payee;
  final double amount;
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  static const rate = 22.94, fee = 15.0;
  double amount = 1000;
  int payee = 0, tab = 0;
  final history = <Transfer>[Transfer(payees[1], 350), Transfer(payees[2], 2400)];

  Future<void> review() async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => ReviewSheet(amount: amount, receive: amount * rate, fee: fee, payee: payees[payee]),
    );
    if (sent == true && mounted) setState(() => history.insert(0, Transfer(payees[payee], amount)));
  }

  @override
  Widget build(BuildContext context) {
    final s = Tokens.of(context);
    return Scaffold(
      backgroundColor: s.bg,
      body: LayoutBuilder(builder: (context, box) {
        final wide = box.maxWidth >= 560;
        final main = tab == 0 ? _send(s, wide) : _history(s);
        if (!wide) {
          return SafeArea(child: Column(children: [Expanded(child: main), _tabs(s)]));
        }
        return Row(children: [
          Container(
            width: 148, color: s.ink, padding: const EdgeInsets.fromLTRB(14, 20, 14, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Padding(padding: const EdgeInsets.only(left: 8, bottom: 18), child: Text('Remit', style: ts(18, Colors.white, w: 750, wd: 80))),
              for (final (i, label) in ['Send', 'History'].indexed) _sideItem(s, label, i),
              _sideItem(s, 'Beneficiaries', -1), _sideItem(s, 'Rates', -1),
            ]),
          ),
          Expanded(child: main),
          Container(
            width: 176, decoration: BoxDecoration(border: Border(left: BorderSide(color: s.line))), padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Recent', style: ts(11, s.mute)), const SizedBox(height: 10),
              for (final t in history.take(5)) Padding(padding: const EdgeInsets.only(bottom: 10), child: Row(children: [
                Avatar(t.payee.initials, size: 26), const SizedBox(width: 8),
                Expanded(child: Text(t.payee.name, overflow: TextOverflow.ellipsis, style: ts(12.5, s.ink, w: 550))),
              ])),
            ]),
          ),
        ]);
      }),
    );
  }

  Widget _sideItem(Skin s, String label, int i) {
    final on = i == tab;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Material(
        color: on ? Colors.white.withValues(alpha: .12) : Colors.transparent, borderRadius: BorderRadius.circular(8),
        child: InkWell(
          borderRadius: BorderRadius.circular(8), onTap: i < 0 ? null : () => setState(() => tab = i),
          child: Padding(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9), child: Text(label, style: ts(13, Colors.white.withValues(alpha: on ? 1 : .6), w: on ? 600 : 400))),
        ),
      ),
    );
  }

  Widget _tabs(Skin s) => Container(
        decoration: BoxDecoration(color: s.bg, border: Border(top: BorderSide(color: s.line))),
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
          for (final (i, item) in const [(Icons.north_east_rounded, 'Send'), (Icons.receipt_long_rounded, 'History')].indexed)
            InkWell(
              borderRadius: BorderRadius.circular(12), onTap: () => setState(() => tab = i),
              child: Padding(padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 6), child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(item.$1, size: 20, color: i == tab ? s.brand : s.mute),
                const SizedBox(height: 2),
                Text(item.$2, style: ts(10.5, i == tab ? s.brand : s.mute, w: 600)),
              ])),
            ),
        ]),
      );

  Widget _send(Skin s, bool wide) {
    final p = payees[payee];
    return ListView(padding: EdgeInsets.fromLTRB(16, wide ? 18 : 10, 16, 16), children: [
      Row(children: [
        Expanded(child: Text('Send money', style: ts(19, s.ink, w: 700, wd: 84))),
        const Avatar('MS', size: 30),
      ]),
      const SizedBox(height: 14),
      Container(
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: s.line)),
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('You send', style: ts(11, s.mute)),
          Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Expanded(child: RollingAmount(value: amount, unit: 'QAR', size: 25)),
            _step(s, Icons.remove_rounded, () => setState(() => amount = math.max(100, amount - 100))),
            const SizedBox(width: 6),
            _step(s, Icons.add_rounded, () => setState(() => amount = math.min(20000, amount + 100))),
          ]),
          const SizedBox(height: 10),
          Wrap(spacing: 6, runSpacing: 6, children: [
            for (final v in const [500.0, 1000.0, 2500.0, 5000.0])
              GestureDetector(
                onTap: () => setState(() => amount = v),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: amount == v ? s.brand : s.soft, borderRadius: BorderRadius.circular(99)),
                  child: Text(money(v).replaceAll('.00', ''), style: ts(11.5, amount == v ? Colors.white : s.brand, w: 600)),
                ),
              ),
          ]),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(children: [
              Expanded(child: Text('1 QAR = 22.94 INR', style: ts(11.5, s.brand, w: 600))),
              Text('Fee 15.00 QAR', style: ts(11.5, s.mute)),
            ]),
          ),
          Text('They receive', style: ts(11, s.mute)),
          RollingAmount(value: amount * rate, unit: 'INR', size: 25),
        ]),
      ),
      const SizedBox(height: 10),
      Material(
        color: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: s.line)),
        child: InkWell(
          borderRadius: BorderRadius.circular(14), onTap: () => setState(() => payee = (payee + 1) % payees.length),
          child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [
            AnimatedSwitcher(duration: const Duration(milliseconds: 300), child: Avatar(p.initials, key: ValueKey(p.initials), size: 36)),
            const SizedBox(width: 10),
            Expanded(child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300), layoutBuilder: (c, prev) => Stack(alignment: Alignment.centerLeft, children: [...prev, ?c]),
              transitionBuilder: (child, a) => FadeTransition(opacity: a, child: SlideTransition(position: Tween(begin: const Offset(0, .4), end: Offset.zero).animate(a), child: child)),
              child: Column(key: ValueKey(p.name), crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(p.name, style: ts(14, s.ink, w: 650)),
                Text(p.account, style: ts(11.5, s.mute)),
              ]),
            )),
            Icon(Icons.swap_vert_rounded, color: s.mute, size: 20),
          ])),
        ),
      ),
      const SizedBox(height: 14),
      FilledButton(
        onPressed: review,
        style: FilledButton.styleFrom(backgroundColor: s.brand, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
        child: Text('Review transfer', style: ts(14.5, Colors.white, w: 650)),
      ),
    ]);
  }

  Widget _step(Skin s, IconData icon, VoidCallback onTap) => Material(
        color: s.soft, shape: const CircleBorder(),
        child: InkWell(customBorder: const CircleBorder(), onTap: onTap, child: Padding(padding: const EdgeInsets.all(7), child: Icon(icon, size: 18, color: s.brand))),
      );

  Widget _history(Skin s) => ListView(padding: const EdgeInsets.all(16), children: [
        Text('History', style: ts(19, s.ink, w: 700, wd: 84)),
        const SizedBox(height: 12),
        for (final (i, t) in history.indexed)
          TweenAnimationBuilder<double>(
            key: ValueKey('${t.payee.name}${t.amount}${history.length - i}'),
            tween: Tween(begin: 0, end: 1), duration: Duration(milliseconds: 350 + i * 90), curve: Curves.easeOutCubic,
            builder: (_, v, child) => Opacity(opacity: v, child: Transform.translate(offset: Offset(0, 14 * (1 - v)), child: child)),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: s.line)),
              child: Row(children: [
                Avatar(t.payee.initials, size: 34), const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t.payee.name, style: ts(13.5, s.ink, w: 650)),
                  Text('${money(t.amount * rate)} INR', style: ts(11.5, s.mute)),
                ])),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text('${money(t.amount)} QAR', style: ts(13, s.ink, w: 600)),
                  Container(
                    margin: const EdgeInsets.only(top: 3), padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(color: s.soft, borderRadius: BorderRadius.circular(99)),
                    child: Text('Paid', style: ts(10, s.brand, w: 650)),
                  ),
                ]),
              ]),
            ),
          ),
      ]);
}

class Avatar extends StatelessWidget {
  const Avatar(this.initials, {super.key, required this.size});
  final String initials;
  final double size;
  @override
  Widget build(BuildContext context) {
    final s = Tokens.of(context);
    return Container(
      width: size, height: size, alignment: Alignment.center,
      decoration: BoxDecoration(color: s.soft, shape: BoxShape.circle),
      child: Text(initials, style: ts(size * .36, s.brand, w: 700)),
    );
  }
}

/// A number that counts to its new value whenever it changes.
class RollingAmount extends StatelessWidget {
  const RollingAmount({super.key, required this.value, required this.unit, required this.size});
  final double value, size;
  final String unit;
  @override
  Widget build(BuildContext context) {
    final s = Tokens.of(context);
    return TweenAnimationBuilder<double>(
      tween: Tween(end: value), duration: const Duration(milliseconds: 650), curve: Curves.easeOutQuart,
      builder: (_, v, _) => FittedBox(
        fit: BoxFit.scaleDown, alignment: Alignment.centerLeft,
        child: Text.rich(TextSpan(children: [
          TextSpan(text: money(v), style: ts(size, s.ink, w: 750, wd: 86).copyWith(fontFeatures: const [FontFeature.tabularFigures()])),
          TextSpan(text: ' $unit', style: ts(size * .48, s.mute, w: 600)),
        ])),
      ),
    );
  }
}

class ReviewSheet extends StatefulWidget {
  const ReviewSheet({super.key, required this.amount, required this.receive, required this.fee, required this.payee});
  final double amount, receive, fee;
  final Payee payee;
  @override
  State<ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<ReviewSheet> with SingleTickerProviderStateMixin {
  late final AnimationController done = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100));
  double drag = 0;
  bool sent = false;

  @override
  void dispose() { done.dispose(); super.dispose(); }

  Future<void> send() async {
    setState(() => sent = true);
    await done.forward();
    await Future<void>.delayed(const Duration(milliseconds: 650));
    if (mounted) Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    final s = Tokens.of(context);
    Widget row(String k, String v, {bool strong = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 7),
          child: Row(children: [Expanded(child: Text(k, style: ts(12.5, s.mute))), Text(v, style: ts(strong ? 15 : 13, s.ink, w: strong ? 700 : 550))]),
        );
    return Container(
      decoration: BoxDecoration(color: s.bg, borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 18),
      child: AnimatedSize(
        duration: const Duration(milliseconds: 350), curve: Curves.easeOutCubic,
        child: sent
            ? SizedBox(
                height: 230, width: double.infinity,
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  AnimatedBuilder(animation: done, builder: (_, _) => CustomPaint(size: const Size(84, 84), painter: CheckPainter(done.value, s.brand, s.soft))),
                  const SizedBox(height: 14),
                  FadeTransition(opacity: CurvedAnimation(parent: done, curve: const Interval(.6, 1)), child: Column(children: [
                    Text('${money(widget.receive)} INR sent', style: ts(17, s.ink, w: 700, wd: 86)),
                    const SizedBox(height: 3),
                    Text('to ${widget.payee.name}', style: ts(12.5, s.mute)),
                  ])),
                ]),
              )
            : Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Center(child: Container(width: 38, height: 4, margin: const EdgeInsets.only(bottom: 14), decoration: BoxDecoration(color: s.line, borderRadius: BorderRadius.circular(9)))),
                Text('Review transfer', style: ts(18, s.ink, w: 700, wd: 84)),
                const SizedBox(height: 8),
                row('To', widget.payee.name),
                row('You send', '${money(widget.amount)} QAR'),
                row('Fee', '${money(widget.fee)} QAR'),
                Divider(color: s.line, height: 14),
                row('They receive', '${money(widget.receive)} INR', strong: true),
                const SizedBox(height: 14),
                LayoutBuilder(builder: (context, box) {
                  const knob = 46.0;
                  final max = box.maxWidth - knob - 8;
                  return GestureDetector(
                    onHorizontalDragUpdate: (d) => setState(() => drag = (drag + d.delta.dx).clamp(0, max)),
                    onHorizontalDragEnd: (_) { if (drag > max * .82) { send(); } else { setState(() => drag = 0); } },
                    onTap: send,
                    child: Container(
                      height: knob + 8, decoration: BoxDecoration(color: s.brand, borderRadius: BorderRadius.circular(99)),
                      child: Stack(alignment: Alignment.centerLeft, children: [
                        Center(child: Opacity(opacity: (1 - drag / math.max(1, max) * 1.6).clamp(0, 1), child: Text('Slide to send', style: ts(14, Colors.white, w: 650)))),
                        Transform.translate(
                          offset: Offset(4 + drag, 0),
                          child: Container(width: knob, height: knob, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: Icon(Icons.arrow_forward_rounded, color: s.brand)),
                        ),
                      ]),
                    ),
                  );
                }),
              ]),
      ),
    );
  }
}

/// Draws a ring that sweeps closed, then a check mark, with a soft burst behind.
class CheckPainter extends CustomPainter {
  CheckPainter(this.t, this.brand, this.soft);
  final double t;
  final Color brand, soft;
  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero), r = size.width / 2;
    final pop = Curves.elasticOut.transform((t / .7).clamp(0, 1));
    canvas.drawCircle(c, r * (.6 + .4 * pop), Paint()..color = soft);
    final ring = Paint()..color = brand..style = PaintingStyle.stroke..strokeWidth = 4..strokeCap = StrokeCap.round;
    canvas.drawArc(Rect.fromCircle(center: c, radius: r - 6), -math.pi / 2, math.pi * 2 * Curves.easeOutCubic.transform((t / .55).clamp(0, 1)), false, ring);
    final k = Curves.easeOutCubic.transform(((t - .4) / .45).clamp(0, 1));
    if (k > 0) {
      final a = Offset(r * .58, r * 1.04), b = Offset(r * .88, r * 1.32), d = Offset(r * 1.44, r * .72);
      final path = Path()..moveTo(a.dx, a.dy);
      final k1 = (k / .4).clamp(0.0, 1.0), k2 = ((k - .4) / .6).clamp(0.0, 1.0);
      path.lineTo(a.dx + (b.dx - a.dx) * k1, a.dy + (b.dy - a.dy) * k1);
      if (k2 > 0) path.lineTo(b.dx + (d.dx - b.dx) * k2, b.dy + (d.dy - b.dy) * k2);
      canvas.drawPath(path, ring..strokeWidth = 5..strokeJoin = StrokeJoin.round);
    }
    final burst = ((t - .5) / .5).clamp(0.0, 1.0);
    if (burst > 0 && burst < 1) {
      final p = Paint()..color = brand.withValues(alpha: 1 - burst)..strokeWidth = 2.5..strokeCap = StrokeCap.round;
      for (var i = 0; i < 8; i++) {
        final ang = i * math.pi / 4, r1 = r + 4 + burst * 10, r2 = r1 + 7 * (1 - burst);
        canvas.drawLine(c + Offset(math.cos(ang), math.sin(ang)) * r1, c + Offset(math.cos(ang), math.sin(ang)) * r2, p);
      }
    }
  }
  @override
  bool shouldRepaint(CheckPainter old) => old.t != t || old.brand != brand;
}
