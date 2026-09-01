import { Vector2,Vector2Like} from '@dxyl/math2'

export class Curve{
    type:string='Curve'
    needsUpdate = false
    needsPointsUpdate = false
    cacheArcLengths:number[]=null
    arcLengthDivisions:number=200
    points:Vector2Like[]
    getPoint(t:number,out?:Vector2):Vector2{
        return out
    }
    getPointAt(u:number,out?:Vector2):Vector2Like{
    	const t = this.getUtoTmapping( u );
		return this.getPoint( t, out );
    }
    getUtoTmapping( u:number, distance:number = null ) {

		const arcLengths = this.getLengths();

		let i = 0;
		const il = arcLengths.length;

		let targetArcLength; // The targeted u distance value to get

		if ( distance ) {

			targetArcLength = distance;

		} else {

			targetArcLength = u * arcLengths[ il - 1 ];

		}

		// binary search for the index with largest value smaller than target u distance

		let low = 0, high = il - 1, comparison;

		while ( low <= high ) {

			i = Math.floor( low + ( high - low ) / 2 ); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

			comparison = arcLengths[ i ] - targetArcLength;

			if ( comparison < 0 ) {

				low = i + 1;

			} else if ( comparison > 0 ) {

				high = i - 1;

			} else {

				high = i;
				break;

				// DONE

			}

		}

		i = high;

		if ( arcLengths[ i ] === targetArcLength ) {

			return i / ( il - 1 );

		}

		// we could get finer grain at lengths, or use simple interpolation between two points

		const lengthBefore = arcLengths[ i ];
		const lengthAfter = arcLengths[ i + 1 ];

		const segmentLength = lengthAfter - lengthBefore;

		// determine where we are between the 'before' and 'after' points

		const segmentFraction = ( targetArcLength - lengthBefore ) / segmentLength;

		// add that fractional amount to t

		const t = ( i + segmentFraction ) / ( il - 1 );

		return t;

	}
    getResolution(divisions:number){
        return divisions
    }
    getPoints(divisions:number=this.getResolution(12)){
        if(this.points&&this.points.length===divisions+1&&!this.needsPointsUpdate){
            return this.points
        }
        this.needsPointsUpdate = false;
        const points=[] as Vector2Like[]
        const out=Vector2.create()
        let lastPoint:null|Vector2=null
        for(let i=0;i<=divisions;i++){
            const t=i/divisions
            this.getPoint(t,out)
            if(lastPoint===null||!lastPoint.equalsEpsilon(out)){
                points.push({x:out.x,y:out.y})
            }
            if(lastPoint===null){
                lastPoint=Vector2.create()
            }
            lastPoint.copy(out)
        }
        this.points=points
        return points
    }
    getSpacedPoints( divisions = 5 ) {
		const points = [];
		for ( let d = 0; d <= divisions; d ++ ) {
			points.push( this.getPointAt( d / divisions ) );
		}
		return points;

	}
    getStrokePoints(options:{width:number,join:'round'|'bevel'|'miter',cap:'round'|'bevel'|'miter',miterLimit:number}){
        const {width=1,join='miter',cap='butt',miterLimit=10}=options
        const points=this.getPoints()
        const strokePoints=[] as Vector2Like[]
    }
    getLength(){
        const lengths=this.getLengths()
        return lengths[lengths.length-1]
    }
    getLengths(divisions:number=this.arcLengthDivisions){
        if(this.cacheArcLengths &&
			( this.cacheArcLengths.length === divisions + 1 ) &&
			! this.needsUpdate){
            return this.cacheArcLengths
        }
       	this.needsUpdate = false;
		const cache:number[] = [];
		let current=Vector2.create(), last = this.getPoint( 0 );
		let sum = 0;

		cache.push( 0 );

		for ( let p = 1; p <= divisions; p ++ ) {

			this.getPoint( p / divisions,current );
			sum += current.distanceTo( last );
			cache.push( sum );
			last = current;
		}
        this.cacheArcLengths=cache
        return cache
    }
    getTangentAt( u:number, optionalTarget?:Vector2 ) {

		const t = this.getUtoTmapping( u );
		return this.getTangent( t, optionalTarget );
	}
    getTangent( t:number, optionalTarget?:Vector2 ) {

		const delta = 0.0001;
		let t1 = t - delta;
		let t2 = t + delta;

		// Capping in case of danger

		if ( t1 < 0 ) t1 = 0;
		if ( t2 > 1 ) t2 = 1;

		const pt1 = this.getPoint( t1 );
		const pt2 = this.getPoint( t2 );

		const tangent = optionalTarget || Vector2.create();

		tangent.copy( pt2 ).subtract( pt1 ).normalize();

		return tangent;
	}
    isPointInPolygon(x:number,y:number,fillRule:'nonzero'|'evenodd'='nonzero'){
        const points=this.getPoints()
        let isInside=false
        for(let i=0;i<points.length;i++){
            const p1=points[i]
            const p2=points[(i+1)%points.length]
            if((p1.y<y!==p2.y<y)&&(x-p1.x)/(p2.y-p1.y)*(p2.x-p1.x)/(p2.y-p1.y)+p1.x>x){
                isInside=!isInside
            }
        }
        return isInside
    }
}